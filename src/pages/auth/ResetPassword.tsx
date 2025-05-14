import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

function ResetPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    new_password: '',
    confirm_password: '',
  });
  
  // Form error state
  const [errors, setErrors] = useState({
    email: '',
    new_password: '',
    confirm_password: '',
    form: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear form error when any field is changed
    if (errors.form) {
      setErrors(prev => ({
        ...prev,
        form: ''
      }));
    }
  };
  
  const validateForm = () => {
    let valid = true;
    const newErrors = { ...errors };
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }
    
    // Password validation
    if (!formData.new_password) {
      newErrors.new_password = 'New password is required';
      valid = false;
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
      valid = false;
    }
    
    // Confirm password validation
    if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Resetting password for:", formData.email);
      await authApi.resetPassword({
        email: formData.email,
        new_password: formData.new_password
      });
      
      setIsSubmitted(true);
      toast.success('Password reset successful! You can now login with your new password.');
    } catch (error) {
      console.error('Password reset failed:', error);
      
      // Set form error
      setErrors(prev => ({
        ...prev,
        form: 'Password reset failed. Please try again or contact support.'
      }));
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Password Reset Successful</CardTitle>
          <CardDescription className="text-center px-6">
            Your password has been reset successfully. You can now login with your new password.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pt-4">
          <div className="w-full max-w-xs bg-blue-50 p-4 rounded-lg text-center text-blue-800 text-sm mb-2">
            <p>For security reasons, you'll need to use your new password to login.</p>
          </div>
          <Button 
            onClick={() => navigate('/auth/login')}
            className="min-w-[200px] transition-all hover:scale-105"
            size="lg"
          >
            Go to Login
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center pb-6 pt-2">
          <Link to="/support" className="text-sm text-muted-foreground hover:text-primary">
            Need help? Contact support
          </Link>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>
          Enter your email and new password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <div className="p-3 mb-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
              {errors.form}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="new_password" className="text-sm font-medium">
              New Password
            </label>
            <Input
              id="new_password"
              name="new_password"
              type="password"
              value={formData.new_password}
              onChange={handleChange}
              className={errors.new_password ? 'border-red-500' : ''}
            />
            {errors.new_password && (
              <p className="text-red-500 text-xs">{errors.new_password}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirm_password" className="text-sm font-medium">
              Confirm Password
            </label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              value={formData.confirm_password}
              onChange={handleChange}
              className={errors.confirm_password ? 'border-red-500' : ''}
            />
            {errors.confirm_password && (
              <p className="text-red-500 text-xs">{errors.confirm_password}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link to="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default ResetPassword;
