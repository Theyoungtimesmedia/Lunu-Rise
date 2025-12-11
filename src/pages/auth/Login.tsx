import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { CountrySelector } from '@/components/CountrySelector';
import { auth, googleProvider, appleProvider, db } from '@/integrations/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // AuthContext
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    country: ''
  });

  // Redirect automatically if already logged in
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.country) {
      toast.error('Please select your country');
      return;
    }

    setLoading(true);
    try {
      // Workaround for phone-only login using Firebase Email/Password Auth
      const dummyEmail = `${formData.phone}@lunurise.com`;

      const userCredential = await signInWithEmailAndPassword(auth, dummyEmail, formData.password);
      const loggedUser = userCredential.user;

      // 1. Fetch user data from Firestore to check the registered country
      const q = query(collection(db, 'users'), where('phone', '==', formData.phone));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // This should not happen if registration is done correctly, but as a safeguard
        await auth.signOut();
        toast.error('User data not found. Please contact support.');
        return;
      }

      const userData = snapshot.docs[0].data();
      const registeredCountry = userData.country;

      // 2. Enforce country matching
      if (registeredCountry !== formData.country) {
        await auth.signOut(); // Log out the user immediately
        toast.error('Login failed. Please select the country you registered with.');
        return;
      }

      // Email verification check is removed as per phone-only registration logic

      toast.success('Login successful!');
      // navigation will be triggered by AuthContext effect
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error('Invalid phone number or password.');
      } else {
        toast.error(error.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Social sign-in is disabled as per user request for phone-only login.
  const handleOAuthLogin = async (provider: typeof googleProvider | typeof appleProvider) => {
    toast.error('Social sign-in is currently disabled. Please use phone number login.');
  };

  return (
    <Layout showBottomNav={false}>
      <div className="relative min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        {/* Spinner Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
            <span className="ml-4 text-white text-lg">Loading...</span>
          </div>
        )}

        <Card className="w-full max-w-md z-10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
	            {/* Social sign-in disabled as per user request for phone-only login */}
	            {/* Phone login form */}
	            <form onSubmit={handlePhoneLogin} className="space-y-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <CountrySelector
                  value={formData.country}
                  onValueChange={(country) => setFormData(prev => ({ ...prev, country }))}
                  disabled={loading}
                />
              </div>

	              <div>
	                <Label htmlFor="phone">Phone Number</Label>
	                <Input
	                  id="phone"
	                  type="tel"
	                  value={formData.phone}
	                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
	                  placeholder="Enter phone number"
	                  required
	                />
	              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                variant="primary_gradient"
                disabled={loading || !formData.country}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="text-center">
                <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot your password?
                </Link>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link to="/auth/register" className="text-primary hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;
