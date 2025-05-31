const API_URL = process.env.NEXT_PUBLIC_API; // Django API URL

// Function to login and get the JWT token
const login = async (username, password) => {
    const response = await fetch(`${API_URL}/api/token/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        throw new Error('Invalid credentials');
    }

    const data = await response.json();
    // Store tokens in localStorage
    if (data) {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
    }

    return data;
};

// Function to get the access token from localStorage
const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

// Function to refresh the access token using the refresh token
const refreshToken = async () => {
    const refresh_token = localStorage.getItem("refresh_token");

    const response = await fetch(`${API_URL}/api/token/refresh/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refresh_token }),
    });

    if (!response.ok) {
        throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    localStorage.setItem("access_token", data.access);
    return data.access
};

// Function to logout
const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("userInfo")
};

export default {
    login,
    logout,
    getAccessToken,
    refreshToken
};
