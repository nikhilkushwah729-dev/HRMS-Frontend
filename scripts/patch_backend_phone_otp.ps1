$ErrorActionPreference = 'Stop'

$svcPath = 'D:\HRMS_Backend\HRMS_BACKEND\apps\backend\app\services\PhoneAuthService.ts'
$ctlPath = 'D:\HRMS_Backend\HRMS_BACKEND\apps\backend\app\controllers\Http\SocialAuthController.ts'

if (-not (Test-Path $svcPath)) { throw "Missing backend file: $svcPath" }
if (-not (Test-Path $ctlPath)) { throw "Missing backend file: $ctlPath" }

$svc = Get-Content -Raw -Path $svcPath

$newRequestOtp = @'
    /**
     * Request OTP for phone login
     */
    async requestOtp(phone: string, orgId?: number): Promise<{ success: boolean; message: string; otpReference?: number }> {
        // Validate phone format
        const cleanPhone = this.cleanPhoneNumber(phone)

        if (!cleanPhone) {
            return { success: false, message: 'Invalid phone number format' }
        }

        // Be flexible when matching DB values (some installations store without +91)
        const digitsOnly = cleanPhone.replace(/\D/g, '')
        const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly

        const variants = Array.from(new Set([
            cleanPhone,
            digitsOnly,
            last10,
            `+${digitsOnly}`,
            `+91${last10}`,
            `91${last10}`,
        ].filter(Boolean)))

        // Find employee by phone (do not assume a single canonical format)
        const employee = await Employee.query()
            .where((query) => {
                variants.forEach((v) => query.orWhere('phone', v))
            })
            .if(orgId, (query) => query.where('org_id', orgId!))
            .first()

        if (!employee) {
            // Don't reveal if phone exists
            return {
                success: true,
                message: 'If an account with this phone exists, an OTP has been sent.'
            }
        }

        // Check if phone auth is enabled for this employee
        if (!employee.phoneAuthEnabled) {
            return {
                success: false,
                message: 'Phone authentication is not enabled for this account. Please contact administrator.'
            }
        }

        // Check for existing valid OTP (within last 5 minutes)
        const fiveMinutesAgo = DateTime.now().minus({ minutes: 5 })
        const existingOtp = await OtpToken.query()
            .where('employee_id', employee.id)
            .where('is_used', false)
            .where('purpose', 'phone_verify')
            .where('created_at', '>', fiveMinutesAgo.toSQL()!)
            .first()

        if (existingOtp) {
            // Don't send too many OTPs
            return {
                success: true,
                message: 'OTP recently sent. Please wait before requesting another.',
                otpReference: existingOtp.id
            }
        }

        // Generate new OTP
        const otp = this.generateOTP()
        const otpHash = await hash.make(otp)
        const expiresAt = DateTime.now().plus({ minutes: this.OTP_EXPIRY_MINUTES })

        // Store OTP using existing OtpToken model (purpose must match DB enum)
        const phoneOtp = await OtpToken.create({
            employeeId: employee.id,
            orgId: employee.orgId,
            email: employee.email || '',
            otpHash,
            purpose: 'phone_verify',
            channel: 'sms',
            attempts: 0,
            maxAttempts: this.MAX_ATTEMPTS,
            isUsed: false,
            expiresAt: expiresAt,
            ipAddress: null,
        })

        // Send OTP via SMS
        const message = `Your HRMS verification code is: ${otp}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`
        const smsSent = await this.sendSMS(cleanPhone, message)

        if (!smsSent) {
            // In development/testing, still return success (OTP is logged by sendSMS fallback)
            if (env.get('NODE_ENV') === 'development') {
                return {
                    success: true,
                    message: 'OTP generated (dev mode).',
                    otpReference: phoneOtp.id
                }
            }

            await phoneOtp.delete()
            return { success: false, message: 'Failed to send OTP. Please try again.' }
        }

        return {
            success: true,
            message: 'OTP sent successfully.',
            otpReference: phoneOtp.id
        }
    }
'@

$svcPattern = [regex]::new("(?s)\s*async requestOtp\([\s\S]*?\r?\n\s*\}\r?\n\r?\n\s*/\*\*\s*\r?\n\s*\* Verify OTP and login")
if (-not $svcPattern.IsMatch($svc)) { throw 'Could not find requestOtp block to replace in PhoneAuthService.ts' }
$svc = $svcPattern.Replace($svc, "`n$newRequestOtp`n`n    /**`n     * Verify OTP and login", 1)
Set-Content -Path $svcPath -Value $svc -Encoding utf8

$ctl = Get-Content -Raw -Path $ctlPath

$newVerify = @'

  /**
   * POST /auth/phone/verify - Verify OTP and login
   */
  async verifyPhoneOtp({ request, response }: HttpContext) {
    const { phone, otp, otpReference, ipAddress } = request.only(['phone', 'otp', 'otpReference', 'ipAddress'])

    if (!phone || !otpReference || !otp) {
      return response.badRequest({
        success: false,
        message: 'Phone, OTP reference and OTP are required'
      })
    }

    const refNumber = Number(otpReference)
    if (!Number.isFinite(refNumber)) {
      return response.badRequest({
        success: false,
        message: 'Invalid OTP reference'
      })
    }

    const result = await this.phoneAuthService.verifyOtp(refNumber, otp, ipAddress)

    if (!result.success) {
      return response.status(401).json(result)
    }

    return response.ok({
      success: true,
      message: result.message,
      accessToken: result.accessToken,
      employee: {
        id: result.employee?.id,
        firstName: result.employee?.firstName,
        lastName: result.employee?.lastName,
        email: result.employee?.email,
        phone: result.employee?.phone,
      },
    })
  }

'@

$ctlPattern = [regex]::new("(?s)\s*async verifyPhoneOtp\([\s\S]*?\r?\n\s*\}\r?\n\r?\n\s*/\*\*\s*\r?\n\s*\* POST /auth/phone/resend")
if (-not $ctlPattern.IsMatch($ctl)) { throw 'Could not find verifyPhoneOtp block to replace in SocialAuthController.ts' }
$ctl = $ctlPattern.Replace($ctl, "`n$newVerify`n  /**`n   * POST /auth/phone/resend", 1)
Set-Content -Path $ctlPath -Value $ctl -Encoding utf8

Write-Host 'Backend phone OTP patch applied.'
