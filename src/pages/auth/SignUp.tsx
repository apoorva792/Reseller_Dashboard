import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

// Use environment variable instead of imported constant
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jh6x5iq1s9.execute-api.ap-southeast-2.amazonaws.com/dev';
const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || `${API_BASE_URL}/user`;

function SignUp() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    customer_email_address: '',
    customer_password: '',
    confirmPassword: '',
    customer_logid: '',
    customer_firstname: '',
    customer_lastname: '',
    customer_gender: 'M',
    customer_telephone: '',
    customer_secret_qu: 'What is your favorite color?',
    customer_secret_answer: '',
    customer_company_name: '',
    customer_business_entity: 'LLP',
    customer_company_type: '0',
    customer_company_address: '',
    customer_product_service: '0',
    customer_main_product: '',
    gstin_code: '',
    customer_country_id: '91',
    customer_zone_id: '1',
    customer_status: '1',
    customer_type: '1',
    termsAccepted: false
  });
  
  // Form error state
  const [errors, setErrors] = useState({
    customer_email_address: '',
    customer_password: '',
    confirmPassword: '',
    customer_logid: '',
    customer_firstname: '',
    customer_lastname: '',
    customer_telephone: '',
    customer_secret_answer: '',
    customer_company_name: '',
    customer_company_address: '',
    customer_main_product: '',
    gstin_code: '',
    termsAccepted: ''
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    let valid = true;
    const newErrors = { ...errors };
    
    // Email validation
    if (!formData.customer_email_address) {
      newErrors.customer_email_address = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.customer_email_address)) {
      newErrors.customer_email_address = 'Email is invalid';
      valid = false;
    }
    
    // Username validation
    if (!formData.customer_logid) {
      newErrors.customer_logid = 'Username is required';
      valid = false;
    } else if (formData.customer_logid.length < 4) {
      newErrors.customer_logid = 'Username must be at least 4 characters';
      valid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.customer_logid)) {
      newErrors.customer_logid = 'Username can only contain letters, numbers and underscores';
      valid = false;
    }
    
    // Password validation
    if (!formData.customer_password) {
      newErrors.customer_password = 'Password is required';
      valid = false;
    } else if (formData.customer_password.length < 8) {
      newErrors.customer_password = 'Password must be at least 8 characters';
      valid = false;
    }
    
    // Confirm password validation
    if (formData.customer_password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }
    
    // Name validation
    if (!formData.customer_firstname) {
      newErrors.customer_firstname = 'First name is required';
      valid = false;
    }
    
    if (!formData.customer_lastname) {
      newErrors.customer_lastname = 'Last name is required';
      valid = false;
    }
    
    // Phone validation
    if (!formData.customer_telephone) {
      newErrors.customer_telephone = 'Phone number is required';
      valid = false;
    }
    
    // Secret answer validation
    if (!formData.customer_secret_answer) {
      newErrors.customer_secret_answer = 'Secret answer is required';
      valid = false;
    }
    
    // Company validation
    if (!formData.customer_company_name) {
      newErrors.customer_company_name = 'Company name is required';
      valid = false;
    }
    
    if (!formData.customer_company_address) {
      newErrors.customer_company_address = 'Company address is required';
      valid = false;
    }
    
    if (!formData.customer_main_product) {
      newErrors.customer_main_product = 'Main product is required';
      valid = false;
    }
    
    if (!formData.gstin_code) {
      newErrors.gstin_code = 'GSTIN code is required';
      valid = false;
    }
    
    // Terms acceptance
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create registration payload matching the backend API expectations exactly
      const registrationData = {
        customer_email_address: formData.customer_email_address,
        customer_password: formData.customer_password,
        customer_logid: formData.customer_logid,
        customer_gender: formData.customer_gender,
        customer_firstname: formData.customer_firstname,
        customer_lastname: formData.customer_lastname,
        customer_telephone: formData.customer_telephone,
        customer_secret_qu: formData.customer_secret_qu,
        customer_secret_answer: formData.customer_secret_answer,
        customer_status: Number(formData.customer_status),
        customer_type: Number(formData.customer_type),
        customer_country_id: Number(formData.customer_country_id),
        customer_zone_id: Number(formData.customer_zone_id),
        customer_company_name: formData.customer_company_name,
        customer_business_entity: formData.customer_business_entity,
        customer_company_type: Number(formData.customer_company_type),
        customer_company_address: formData.customer_company_address,
        customer_product_service: Number(formData.customer_product_service),
        customer_main_product: formData.customer_main_product,
        gstin_code: formData.gstin_code
      };
      
      console.log("Registering with data:", JSON.stringify(registrationData, null, 2));
      console.log("Registration request URL:", `${USER_SERVICE_URL}/register`);
      await register(registrationData);
      navigate('/auth/login');
    } catch (error) {
      console.error('Registration failed:', error);
      // Error is handled in the register function with toast messages
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="customer_firstname" className="text-sm font-medium">
                  First Name
                </label>
                <Input 
                  id="customer_firstname"
                  name="customer_firstname"
                  placeholder="John" 
                  value={formData.customer_firstname}
                  onChange={handleChange}
                />
                {errors.customer_firstname && (
                  <p className="text-red-500 text-xs">{errors.customer_firstname}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="customer_lastname" className="text-sm font-medium">
                  Last Name
                </label>
                <Input 
                  id="customer_lastname"
                  name="customer_lastname"
                  placeholder="Doe" 
                  value={formData.customer_lastname}
                  onChange={handleChange}
                />
                {errors.customer_lastname && (
                  <p className="text-red-500 text-xs">{errors.customer_lastname}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="customer_email_address" className="text-sm font-medium">
                  Email
                </label>
                <Input 
                  id="customer_email_address"
                  name="customer_email_address"
                  type="email" 
                  placeholder="john@example.com" 
                  value={formData.customer_email_address}
                  onChange={handleChange}
                />
                {errors.customer_email_address && (
                  <p className="text-red-500 text-xs">{errors.customer_email_address}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="customer_logid" className="text-sm font-medium">
                  Username
                </label>
                <Input 
                  id="customer_logid"
                  name="customer_logid"
                  placeholder="johndoe123" 
                  value={formData.customer_logid}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500">This will be your login ID</p>
                {errors.customer_logid && (
                  <p className="text-red-500 text-xs">{errors.customer_logid}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="customer_telephone" className="text-sm font-medium">
                  Phone
                </label>
                <Input 
                  id="customer_telephone"
                  name="customer_telephone"
                  placeholder="9876543210" 
                  value={formData.customer_telephone}
                  onChange={handleChange}
                />
                {errors.customer_telephone && (
                  <p className="text-red-500 text-xs">{errors.customer_telephone}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="customer_password" className="text-sm font-medium">
                  Password
                </label>
                <Input 
                  id="customer_password"
                  name="customer_password"
                  type="password" 
                  placeholder="••••••••" 
                  value={formData.customer_password}
                  onChange={handleChange}
                />
                {errors.customer_password && (
                  <p className="text-red-500 text-xs">{errors.customer_password}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <Input 
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password" 
                  placeholder="••••••••" 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="customer_gender" className="text-sm font-medium">
                  Gender
                </label>
                <select
                  id="customer_gender"
                  name="customer_gender"
                  value={formData.customer_gender}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="customer_company_name" className="text-sm font-medium">
                  Company Name
                </label>
                <Input 
                  id="customer_company_name"
                  name="customer_company_name"
                  placeholder="Example Corp" 
                  value={formData.customer_company_name}
                  onChange={handleChange}
                />
                {errors.customer_company_name && (
                  <p className="text-red-500 text-xs">{errors.customer_company_name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="gstin_code" className="text-sm font-medium">
                  GSTIN Code
                </label>
                <Input 
                  id="gstin_code"
                  name="gstin_code"
                  placeholder="GSTIN123456" 
                  value={formData.gstin_code}
                  onChange={handleChange}
                />
                {errors.gstin_code && (
                  <p className="text-red-500 text-xs">{errors.gstin_code}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="customer_business_entity" className="text-sm font-medium">
                  Business Entity
                </label>
                <select
                  id="customer_business_entity"
                  name="customer_business_entity"
                  value={formData.customer_business_entity}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="LLP">LLP</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="Public Limited">Public Limited</option>
                  <option value="Proprietorship">Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="customer_company_type" className="text-sm font-medium">
                  Company Type
                </label>
                <select
                  id="customer_company_type"
                  name="customer_company_type"
                  value={formData.customer_company_type}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="1">Type 1</option>
                  <option value="2">Type 2</option>
                  <option value="3">Type 3</option>
                </select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="customer_company_address" className="text-sm font-medium">
                  Company Address
                </label>
                <Input 
                  id="customer_company_address"
                  name="customer_company_address"
                  placeholder="123 Business St" 
                  value={formData.customer_company_address}
                  onChange={handleChange}
                />
                {errors.customer_company_address && (
                  <p className="text-red-500 text-xs">{errors.customer_company_address}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="customer_product_service" className="text-sm font-medium">
                  Product Service
                </label>
                <select
                  id="customer_product_service"
                  name="customer_product_service"
                  value={formData.customer_product_service}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="1">Service 1</option>
                  <option value="2">Service 2</option>
                  <option value="3">Service 3</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="customer_main_product" className="text-sm font-medium">
                  Main Product
                </label>
                <Input 
                  id="customer_main_product"
                  name="customer_main_product"
                  placeholder="Electronics" 
                  value={formData.customer_main_product}
                  onChange={handleChange}
                />
                {errors.customer_main_product && (
                  <p className="text-red-500 text-xs">{errors.customer_main_product}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium">Security Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="customer_secret_qu" className="text-sm font-medium">
                  Secret Question
                </label>
                <select
                  id="customer_secret_qu"
                  name="customer_secret_qu"
                  value={formData.customer_secret_qu}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="What is your favorite color?">What is your favorite color?</option>
                  <option value="What is your pet's name?">What is your pet's name?</option>
                  <option value="What city were you born in?">What city were you born in?</option>
                  <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="customer_secret_answer" className="text-sm font-medium">
                  Secret Answer
                </label>
                <Input 
                  id="customer_secret_answer"
                  name="customer_secret_answer"
                  value={formData.customer_secret_answer}
                  onChange={handleChange}
                />
                {errors.customer_secret_answer && (
                  <p className="text-red-500 text-xs">{errors.customer_secret_answer}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
                    <Checkbox
              id="termsAccepted"
              checked={formData.termsAccepted}
              onCheckedChange={(checked) => {
                setFormData(prev => ({
                  ...prev,
                  termsAccepted: checked === true
                }));
                if (errors.termsAccepted) {
                  setErrors(prev => ({
                    ...prev,
                    termsAccepted: ''
                  }));
                }
              }}
            />
            <label 
              htmlFor="termsAccepted" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
                      I accept the{" "}
                      <Link to="/terms" className="text-primary hover:underline">
                        terms and conditions
                      </Link>
            </label>
                  </div>
          {errors.termsAccepted && (
            <p className="text-red-500 text-xs mt-1">{errors.termsAccepted}</p>
          )}
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default SignUp;
