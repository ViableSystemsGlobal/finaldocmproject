import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - DOCM Church',
  description: 'Privacy Policy for DOCM Church - Learn how we protect and use your personal information.',
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl opacity-90">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Introduction</h2>
            <p className="text-gray-700 mb-4">
              DOCM Church ("we," "our," or "us") is committed to protecting your privacy and personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
              visit our website, use our mobile application, or interact with our services.
            </p>
            <p className="text-gray-700">
              By using our website or services, you agree to the collection and use of information in accordance 
              with this Privacy Policy. If you disagree with our policies and practices, please do not use our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
            <p className="text-gray-700 mb-4">We may collect personal information that you voluntarily provide to us, including:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Name and contact information (email, phone number, mailing address)</li>
              <li>Date of birth and demographic information</li>
              <li>Prayer requests and spiritual needs</li>
              <li>Donation and giving history</li>
              <li>Event registration information</li>
              <li>Ministry involvement and volunteer preferences</li>
              <li>Photos and videos from church events (with consent)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Automatically Collected Information</h3>
            <p className="text-gray-700 mb-4">When you visit our website or use our mobile app, we may automatically collect:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Usage patterns and navigation data</li>
              <li>Location information (if you grant permission)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Sensitive Information</h3>
            <p className="text-gray-700 mb-4">
              We may collect sensitive information related to your spiritual journey, including prayer requests, 
              pastoral care needs, and religious beliefs. This information is handled with the utmost care and 
              confidentiality.
            </p>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Provide and maintain our church services and programs</li>
              <li>Communicate with you about events, services, and ministry opportunities</li>
              <li>Process donations and manage giving records</li>
              <li>Provide pastoral care and spiritual support</li>
              <li>Send newsletters and church updates</li>
              <li>Improve our website and mobile application</li>
              <li>Ensure the security of our systems and services</li>
              <li>Comply with legal obligations and church governance</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Information Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or otherwise transfer your personal information to outside parties except in 
              the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>With your explicit consent</li>
              <li>To church staff and volunteers who need the information to serve you</li>
              <li>To third-party service providers who assist us in operating our website and services</li>
              <li>To comply with legal requirements or protect our rights</li>
              <li>In connection with a church merger, acquisition, or reorganization</li>
            </ul>
            <p className="text-gray-700">
              All third-party service providers are contractually obligated to keep your information confidential 
              and secure.
            </p>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>SSL encryption for data transmission</li>
              <li>Secure servers and databases</li>
              <li>Access controls and authentication</li>
              <li>Regular security audits and updates</li>
              <li>Staff training on data protection</li>
            </ul>
            <p className="text-gray-700">
              However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Privacy Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Delete your personal information (subject to legal requirements)</li>
              <li>Restrict the processing of your information</li>
              <li>Object to the processing of your information</li>
              <li>Data portability (receive a copy of your information)</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="text-gray-700">
              To exercise these rights, please contact us using the information provided below.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar tracking technologies to enhance your experience on our website. 
              Cookies are small data files stored on your device that help us:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Remember your preferences and settings</li>
              <li>Improve website performance and functionality</li>
              <li>Analyze usage patterns and trends</li>
              <li>Provide personalized content and recommendations</li>
            </ul>
            <p className="text-gray-700">
              You can control cookies through your browser settings, but disabling them may affect website functionality.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              We take special care to protect the privacy of children under 18. We do not knowingly collect 
              personal information from children without parental consent. If you are under 18, please have 
              your parent or guardian review this Privacy Policy and contact us on your behalf.
            </p>
            <p className="text-gray-700">
              For children's ministry activities, we require parental consent and follow additional safety protocols.
            </p>
          </section>

          {/* Third-Party Links */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Third-Party Links</h2>
            <p className="text-gray-700 mb-4">
              Our website may contain links to third-party websites, including social media platforms, 
              donation processors, and ministry partner sites. We are not responsible for the privacy 
              practices of these external sites.
            </p>
            <p className="text-gray-700">
              We encourage you to review the privacy policies of any third-party websites you visit.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices or 
              legal requirements. We will notify you of any material changes by:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Posting the updated policy on our website</li>
              <li>Sending email notifications to registered users</li>
              <li>Announcing changes during church services</li>
            </ul>
            <p className="text-gray-700">
              Your continued use of our services after any changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>DOCM Church</strong></p>
              <p className="text-gray-700 mb-2">Privacy Officer</p>
              <p className="text-gray-700 mb-2">Email: hello@docmchurch.org</p>
              <p className="text-gray-700 mb-2">Phone: (720) 555-0123</p>
              <p className="text-gray-700">
                Mailing Address: 1234 Faith Avenue, Aurora, CO 80014
              </p>
            </div>
          </section>

          {/* Effective Date */}
          <section>
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-blue-800 font-semibold">
                This Privacy Policy is effective as of {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} and will remain in effect except with respect to any changes in its provisions 
                in the future, which will be in effect immediately after being posted on this page.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
} 