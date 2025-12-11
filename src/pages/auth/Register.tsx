import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { CountrySelector } from '@/components/CountrySelector';
import { auth, db, googleProvider, appleProvider } from '@/integrations/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where, updateDoc, increment } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";



const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    country: ''
  });

  // The user requires a registration bonus to be added. Let's assume $10 (1000 units).
  const REGISTRATION_BONUS = 1000; // Assuming 1000 units is $10 or equivalent

  useEffect(() => {
    // Referral logic removed as per user request
  }, [searchParams]);

  const handlePhoneSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.country) {
      toast.error('Please fill all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Workaround for phone-only registration using Firebase Email/Password Auth
      // by constructing a dummy email from the phone number.
      const dummyEmail = `${formData.phone}@lunurise.com`;

      const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, formData.password);
      const user = userCredential.user;

      // Email verification is likely not needed for phone-only
      // await sendEmailVerification(user);

      await setDoc(doc(db, 'users', user.uid), {
        phone: formData.phone,
        country: formData.country,
        balance: REGISTRATION_BONUS, // Add registration bonus
        createdAt: new Date()
      });

      toast.success('Account created! Registration bonus added. Please log in.');
      navigate('/auth/login');
    } catch (error: any) {
      // Check for 'auth/email-already-in-use' and provide a phone-specific message
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This phone number is already registered. Please log in.');
      } else {
        toast.error(error.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

	  // OAuth sign-in is disabled as the user requires phone-only registration.
	  // The buttons are still present in the JSX, so I will remove them next.
	  const handleOAuthSignIn = async (provider: typeof googleProvider | typeof appleProvider) => {
	    toast.error('Social sign-in is currently disabled. Please use phone number registration.');
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
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>Join Luno Rise and start earning today</CardDescription>
          </CardHeader>
          <CardContent>
	          {/* Social sign-in disabled as per user request for phone-only registration */}

	            <form onSubmit={handlePhoneSignUp} className="space-y-4">
              <div>
                <Label>Country</Label>
                <CountrySelector
                  value={formData.country}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                />
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} required />
              </div>
              <div>
                <Label>Password</Label>
                <Input id="password" type="password" value={formData.password} onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))} required minLength={6} />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))} required minLength={6} />
              </div>


              <Button type="submit" className="w-full" variant="primary_gradient" disabled={loading || !formData.country}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account? <Link to="/auth/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Register;
