import { Metadata } from 'next';
import SubmitDetailsForm from '@/components/forms/SubmitDetailsForm';

export const metadata: Metadata = {
  title: 'Submit Your Details | DOCM Church',
  description: 'Join our community by submitting your contact information. We\'d love to connect with you!',
};

export default function SubmitDetailsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
            <svg 
              className="w-10 h-10 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome! We're Glad You're Here
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Please share your details with us so we can stay connected and keep you updated 
            about what's happening in our community.
          </p>
          
          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-gray-500">
            <svg 
              className="w-5 h-5 text-green-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <span>Your information is secure and will be reviewed by our team</span>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <SubmitDetailsForm />
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Questions? Contact us at{' '}
            <a 
              href="mailto:info@docmchurch.org" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              info@docmchurch.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

