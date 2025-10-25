import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - DOCM Church',
  description: 'Terms of Service for DOCM Church - Learn about the terms and conditions for using our website and services.',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-xl opacity-90">
            Please read these terms carefully before using our website and services.
          </p>
          <p className="text-sm mt-4 opacity-75">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          
          {/* Introduction */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              These Terms of Service ("Terms") govern your use of the DOCM Church website, mobile application, 
              and related services (collectively, the "Services") operated by DOCM Church ("we," "us," or "our").
            </p>
            <p className="text-gray-700 mb-4">
              By accessing or using our Services, you agree to be bound by these Terms. If you disagree with 
              any part of these Terms, you may not access or use our Services.
            </p>
            <p className="text-gray-700">
              These Terms constitute a legally binding agreement between you and DOCM Church. Please read 
              them carefully and keep a copy for your records.
            </p>
          </section>

          {/* Acceptance of Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By using our Services, you represent that you are at least 18 years old or have the consent 
              of a parent or guardian. If you are under 18, your parent or guardian must review and agree 
              to these Terms on your behalf.
            </p>
            <p className="text-gray-700">
              Your continued use of our Services after any changes to these Terms constitutes acceptance 
              of the updated Terms.
            </p>
          </section>

          {/* Description of Services */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Description of Services</h2>
            <p className="text-gray-700 mb-4">DOCM Church provides the following services through our website and mobile application:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Information about church services, events, and ministries</li>
              <li>Online giving and donation processing</li>
              <li>Event registration and management</li>
              <li>Communication tools for church members</li>
              <li>Prayer request submission and tracking</li>
              <li>Access to sermons, teachings, and spiritual content</li>
              <li>Ministry volunteer opportunities</li>
              <li>Community interaction features</li>
            </ul>
          </section>

          {/* User Accounts */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">User Accounts</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Registration</h3>
            <p className="text-gray-700 mb-4">
              To access certain features of our Services, you may be required to create an account. 
              You agree to provide accurate, current, and complete information during registration.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Security</h3>
            <p className="text-gray-700 mb-4">You are responsible for:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Keeping your account information current and accurate</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Termination</h3>
            <p className="text-gray-700 mb-4">
              We reserve the right to suspend or terminate your account if you violate these Terms 
              or engage in behavior that is harmful to our community.
            </p>
          </section>

          {/* Acceptable Use */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Acceptable Use Policy</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Permitted Use</h3>
            <p className="text-gray-700 mb-4">You may use our Services for lawful purposes consistent with our church mission, including:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Participating in church activities and events</li>
              <li>Making donations and supporting our ministry</li>
              <li>Accessing spiritual content and resources</li>
              <li>Connecting with other church members</li>
              <li>Requesting prayer and pastoral care</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Prohibited Use</h3>
            <p className="text-gray-700 mb-4">You agree not to use our Services to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Harass, threaten, or harm other users</li>
              <li>Post offensive, inappropriate, or discriminatory content</li>
              <li>Infringe on intellectual property rights</li>
              <li>Distribute spam or unwanted communications</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of our Services</li>
              <li>Impersonate others or misrepresent your identity</li>
            </ul>
          </section>

          {/* Donations and Payments */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Donations and Payments</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Online Giving</h3>
            <p className="text-gray-700 mb-4">
              We offer online giving services to allow you to make donations to DOCM Church. 
              All donations are processed securely through third-party payment processors.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Donation Terms</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Donations are voluntary and non-refundable unless required by law</li>
              <li>You are responsible for any applicable taxes on your donations</li>
              <li>We will provide donation receipts for tax purposes</li>
              <li>Recurring donations can be cancelled at any time</li>
              <li>We reserve the right to refuse or return donations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment Processing</h3>
            <p className="text-gray-700 mb-4">
              Payment processing is handled by third-party services. You agree to comply with 
              their terms of service and privacy policies.
            </p>
          </section>

          {/* Content and Intellectual Property */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Content and Intellectual Property</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Content</h3>
            <p className="text-gray-700 mb-4">
              All content on our Services, including sermons, teachings, images, and text, is owned 
              by DOCM Church or used with permission. This content is protected by copyright and 
              other intellectual property laws.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">User Content</h3>
            <p className="text-gray-700 mb-4">
              By submitting content to our Services (comments, prayer requests, photos), you grant 
              us a non-exclusive, royalty-free license to use, display, and distribute your content 
              in connection with our Services.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Copyright Policy</h3>
            <p className="text-gray-700 mb-4">
              We respect intellectual property rights and will respond to valid copyright infringement 
              claims. If you believe your copyright has been infringed, please contact us with details.
            </p>
          </section>

          {/* Privacy and Data Protection */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy and Data Protection</h2>
            <p className="text-gray-700 mb-4">
              Your privacy is important to us. Our Privacy Policy explains how we collect, use, and 
              protect your personal information. By using our Services, you consent to our data 
              practices as described in our Privacy Policy.
            </p>
            <p className="text-gray-700">
              We implement appropriate security measures to protect your information, but we cannot 
              guarantee complete security of data transmitted over the internet.
            </p>
          </section>

          {/* Disclaimers and Limitations */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Disclaimers and Limitations</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Availability</h3>
            <p className="text-gray-700 mb-4">
              Our Services are provided "as is" and "as available." We do not guarantee that our 
              Services will be uninterrupted, error-free, or completely secure.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Limitation of Liability</h3>
            <p className="text-gray-700 mb-4">
              To the fullest extent permitted by law, DOCM Church shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages arising from your use of our Services.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Third-Party Services</h3>
            <p className="text-gray-700 mb-4">
              Our Services may contain links to or integrate with third-party services. We are not 
              responsible for the content or practices of these third parties.
            </p>
          </section>

          {/* Indemnification */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify and hold harmless DOCM Church, its staff, volunteers, and 
              affiliates from any claims, damages, losses, or expenses arising from your use of 
              our Services or violation of these Terms.
            </p>
          </section>

          {/* Governing Law */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Governing Law and Disputes</h2>
            <p className="text-gray-700 mb-4">
              These Terms are governed by the laws of the state in which DOCM Church is located. 
              Any disputes will be resolved through binding arbitration or in the courts of our jurisdiction.
            </p>
            <p className="text-gray-700">
              We encourage resolving disputes through direct communication and mediation before 
              pursuing formal legal action.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of 
              significant changes through:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Email notifications to registered users</li>
              <li>Prominent notices on our website</li>
              <li>Announcements during church services</li>
            </ul>
            <p className="text-gray-700">
              Your continued use of our Services after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* Termination */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Termination</h2>
            <p className="text-gray-700 mb-4">
              Either party may terminate this agreement at any time. Upon termination:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Your right to use our Services will cease immediately</li>
              <li>We may delete your account and associated data</li>
              <li>Certain provisions of these Terms will survive termination</li>
            </ul>
          </section>

          {/* Contact Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>DOCM Church</strong></p>
              <p className="text-gray-700 mb-2">Legal Department</p>
              <p className="text-gray-700 mb-2">Email: hello@docmchurch.org</p>
              <p className="text-gray-700 mb-2">Phone: (720) 555-0123</p>
              <p className="text-gray-700">
                Mailing Address: 1234 Faith Avenue, Aurora, CO 80014
              </p>
            </div>
          </section>

          {/* Severability */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Severability</h2>
            <p className="text-gray-700 mb-4">
              If any provision of these Terms is found to be unenforceable, the remaining provisions 
              will continue in full force and effect.
            </p>
          </section>

          {/* Entire Agreement */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Entire Agreement</h2>
            <p className="text-gray-700 mb-4">
              These Terms, together with our Privacy Policy, constitute the entire agreement between 
              you and DOCM Church regarding the use of our Services.
            </p>
          </section>

          {/* Effective Date */}
          <section>
            <div className="bg-green-50 p-6 rounded-lg">
              <p className="text-green-800 font-semibold">
                These Terms of Service are effective as of {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} and will remain in effect until updated. By using our Services, you acknowledge 
                that you have read, understood, and agree to be bound by these Terms.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
} 