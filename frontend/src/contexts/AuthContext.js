import { createContext, useContext, useEffect, useState } from 'react';
import api from '../config/api';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currencySymbol, setCurrencySymbol] = useState('₹');

    useEffect(() => {
        // Check for existing token and fetch user info
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('/auth/me');
                    setUser(response.data);
                    
                    // Fetch Profile
                    try {
                        const profileResponse = await api.get('/profile');
                        if (profileResponse.data) {
                            setProfile(profileResponse.data);
                            setCurrencySymbol(getSymbol(profileResponse.data.currency));
                        }
                    } catch (pErr) {
                        console.error('Error fetching profile during init:', pErr);
                    }
                } catch (error) {
                    console.error('Error fetching user info:', error);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    /**
     * Sign up a new user
     */
    const signUp = async (email, password, businessName) => {
        try {
            const response = await api.post('/auth/register', {
                email,
                password,
                businessName
            });

            const { access_token, user: userData } = response.data;
            localStorage.setItem('token', access_token);
            setUser(userData);

            return { data: response.data, error: null };
        } catch (error) {
            console.error('Sign up error:', error);
            const message = error.response?.data?.message || 'Registration failed';
            return { data: null, error: { message } };
        }
    };

    /**
     * Login existing user
     */
    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', {
                email,
                password
            });

            const { access_token, user: userData } = response.data;
            localStorage.setItem('token', access_token);
            setUser(userData);

            return { data: response.data, error: null };
        } catch (error) {
            console.error('Sign in error:', error);
            const message = error.response?.data?.message || 'Invalid email or password';
            return { data: null, error: { message } };
        }
    };

    /**
     * Sign out current user
     */
    const signOut = async () => {
        try {
            localStorage.removeItem('token');
            setUser(null);
            return { error: null };
        } catch (error) {
            console.error('Sign out error:', error);
            return { error };
        }
    };

    /**
     * Reset password (Placeholder for backend implementation)
     */
    const resetPassword = async (email) => {
        try {
            // Backend endpoint needed for this
            return { data: null, error: { message: 'Reset password not implemented on backend yet' } };
        } catch (error) {
            return { data: null, error };
        }
    };

    /**
     * Update password
     */
    const updatePassword = async (newPassword) => {
        try {
            const response = await api.put('/auth/update-password', {
                password: newPassword
            });
            return { data: response.data, error: null };
        } catch (error) {
            console.error('Update password error:', error);
            return { data: null, error };
        }
    };

    /**
     * Get access token for API calls
     */
    const getAccessToken = () => {
        return localStorage.getItem('token');
    };

    const getSymbol = (currency) => {
        switch (currency) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'INR': return '₹';
            default: return '₹';
        }
    };

    const refreshProfile = async () => {
        try {
            const profileResponse = await api.get('/profile');
            if (profileResponse.data) {
                setProfile(profileResponse.data);
                setCurrencySymbol(getSymbol(profileResponse.data.currency));
            }
        } catch (error) {
            console.error('Error refreshing profile:', error);
        }
    };

    const value = {
        user,
        profile,
        currencySymbol,
        loading,
        signUp,
        login,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
        getAccessToken,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
