const runtimeConfig = globalThis as typeof globalThis & {
    __HRMS_CONFIG__?: {
        apiUrl?: string;
    };
};

export const environment = {
    production: true,
    apiUrl: runtimeConfig.__HRMS_CONFIG__?.apiUrl || '/api',
    firebase: {
        apiKey: "AIzaSyCykZJKsYtyQ8xY8uGsTBa-42LY2Fdf-k8",
        authDomain: "hrnexus-8eb7e.firebaseapp.com",
        projectId: "hrnexus-8eb7e",
        storageBucket: "hrnexus-8eb7e.firebasestorage.app",
        messagingSenderId: "51124465546",
        appId: "1:51124465546:web:81fc39d4e8430f9fe52273"
    }
};
