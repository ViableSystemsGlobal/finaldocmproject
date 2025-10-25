import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accessibility - DOCM Church',
  description: 'Accessibility information for DOCM Church - Learn about our commitment to making our services accessible to everyone.',
}

export default function Accessibility() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">Accessibility</h1>
          <p className="text-xl opacity-90">
            We are committed to making our church and digital services accessible to everyone.
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
          
          {/* Our Commitment */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Commitment to Accessibility</h2>
            <p className="text-gray-700 mb-4">
              DOCM Church is committed to ensuring that our worship services, programs, and digital 
              resources are accessible to all individuals, including those with disabilities. We believe 
              that everyone should have equal access to spiritual growth, community fellowship, and 
              participation in church life.
            </p>
            <p className="text-gray-700 mb-4">
              We strive to comply with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA 
              standards and continuously work to improve accessibility across all our services and platforms.
            </p>
            <p className="text-gray-700">
              This commitment extends to both our physical facilities and digital presence, ensuring 
              that barriers are removed wherever possible.
            </p>
          </section>

          {/* Web Accessibility Features */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Web Accessibility Features</h2>
            <p className="text-gray-700 mb-4">
              Our website and mobile application include the following accessibility features:
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Navigation and Structure</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Logical heading structure for screen readers</li>
              <li>Skip navigation links for keyboard users</li>
              <li>Consistent navigation across all pages</li>
              <li>Clear page titles and descriptions</li>
              <li>Breadcrumb navigation where appropriate</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Visual and Text</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>High contrast color combinations</li>
              <li>Scalable text that can be enlarged up to 200%</li>
              <li>Alternative text for all images and graphics</li>
              <li>Descriptive link text</li>
              <li>Readable fonts and appropriate font sizes</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Keyboard and Mouse</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Full keyboard navigation support</li>
              <li>Visible focus indicators</li>
              <li>Logical tab order</li>
              <li>Keyboard shortcuts for common actions</li>
              <li>No mouse-only functionality</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Multimedia</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Closed captions for video content</li>
              <li>Audio descriptions where available</li>
              <li>Transcripts for audio content</li>
              <li>Video controls that are keyboard accessible</li>
              <li>Auto-play disabled by default</li>
            </ul>
          </section>

          {/* Assistive Technologies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Assistive Technology Support</h2>
            <p className="text-gray-700 mb-4">
              Our website is designed to work with various assistive technologies, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Screen readers (JAWS, NVDA, VoiceOver, TalkBack)</li>
              <li>Voice recognition software</li>
              <li>Screen magnification tools</li>
              <li>Alternative keyboards and input devices</li>
              <li>Switch navigation devices</li>
            </ul>
            <p className="text-gray-700">
              We regularly test our website with these technologies to ensure compatibility and usability.
            </p>
          </section>

          {/* Physical Accessibility */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Physical Accessibility</h2>
            <p className="text-gray-700 mb-4">
              Our church facility is designed to be accessible to individuals with mobility, 
              sensory, and other disabilities:
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Building Access</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>ADA-compliant wheelchair ramps and entrances</li>
              <li>Accessible parking spaces near main entrances</li>
              <li>Automatic door openers</li>
              <li>Wide doorways and corridors</li>
              <li>Accessible restrooms with grab bars</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Worship Services</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Designated wheelchair-accessible seating areas</li>
              <li>Assistive listening devices available</li>
              <li>Sign language interpretation (upon request)</li>
              <li>Large print bulletins and materials</li>
              <li>Audio recordings of services</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Programs and Events</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Accessible meeting rooms and classrooms</li>
              <li>Adapted materials for different learning needs</li>
              <li>Flexible seating arrangements</li>
              <li>Accessible transportation coordination</li>
              <li>One-on-one assistance when needed</li>
            </ul>
          </section>

          {/* Services and Accommodations */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Services and Accommodations</h2>
            <p className="text-gray-700 mb-4">
              We provide various services and accommodations to ensure full participation:
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Communication Support</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>ASL interpretation for services and events</li>
              <li>CART (Communication Access Realtime Translation) services</li>
              <li>Braille materials and large print resources</li>
              <li>Audio descriptions for visual presentations</li>
              <li>Written materials in alternative formats</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Mobility Assistance</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Volunteer assistance for navigation</li>
              <li>Reserved seating for mobility devices</li>
              <li>Accessible communion serving</li>
              <li>Modified participation in ceremonies</li>
              <li>Transportation coordination</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Sensory Accommodations</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Quiet areas for sensory breaks</li>
              <li>Adjustable lighting in meeting spaces</li>
              <li>Noise-reducing headphones available</li>
              <li>Sensory-friendly event options</li>
              <li>Service dog accommodation</li>
            </ul>
          </section>

          {/* Digital Accessibility Tools */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Digital Accessibility Tools</h2>
            <p className="text-gray-700 mb-4">
              To enhance your experience with our digital services, you can use these built-in tools:
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Browser Accessibility Features</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Text size adjustment (Ctrl/Cmd + or -)</li>
              <li>High contrast mode</li>
              <li>Screen reader compatibility</li>
              <li>Voice control features</li>
              <li>Keyboard navigation</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Mobile Accessibility</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>VoiceOver (iOS) and TalkBack (Android) support</li>
              <li>Voice control and dictation</li>
              <li>Gesture customization</li>
              <li>Display accommodations</li>
              <li>Hearing aid compatibility</li>
            </ul>
          </section>

          {/* Feedback and Support */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Feedback and Support</h2>
            <p className="text-gray-700 mb-4">
              We welcome feedback about the accessibility of our services and are committed to 
              continuous improvement. If you encounter accessibility barriers or have suggestions 
              for improvement, please contact us.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">How to Request Accommodations</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Contact us at least 48 hours before an event when possible</li>
              <li>Describe the specific accommodation needed</li>
              <li>Provide any relevant details about your needs</li>
              <li>We will work with you to find the best solution</li>
            </ul>
          </section>

          {/* Ongoing Improvements */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ongoing Improvements</h2>
            <p className="text-gray-700 mb-4">
              We are committed to continuously improving accessibility through:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Regular accessibility audits of our website and facilities</li>
              <li>Staff training on disability awareness and accommodation</li>
              <li>Updating our technology and equipment</li>
              <li>Consulting with accessibility experts</li>
              <li>Listening to feedback from our community</li>
              <li>Staying current with accessibility standards and best practices</li>
            </ul>
          </section>

          {/* Standards and Compliance */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Standards and Compliance</h2>
            <p className="text-gray-700 mb-4">
              We strive to meet or exceed the following accessibility standards:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</li>
              <li>Americans with Disabilities Act (ADA) requirements</li>
              <li>Section 508 standards for digital accessibility</li>
              <li>State and local accessibility regulations</li>
            </ul>
            <p className="text-gray-700">
              We conduct regular reviews to ensure ongoing compliance and address any issues promptly.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For accessibility questions, accommodation requests, or feedback, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>DOCM Church</strong></p>
              <p className="text-gray-700 mb-2">Accessibility Coordinator</p>
              <p className="text-gray-700 mb-2">Email: hello@docmchurch.org</p>
              <p className="text-gray-700 mb-2">Phone: (720) 555-0123</p>
              <p className="text-gray-700 mb-2">TTY: (720) 555-0124</p>
              <p className="text-gray-700 mb-4">
                Mailing Address: 1234 Faith Avenue, Aurora, CO 80014
              </p>
              <p className="text-gray-700 text-sm">
                We will respond to accessibility requests within 48 hours and work with you to 
                provide appropriate accommodations.
              </p>
            </div>
          </section>

          {/* Alternative Formats */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Alternative Formats</h2>
            <p className="text-gray-700 mb-4">
              This accessibility statement is available in alternative formats upon request:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Large print version</li>
              <li>Braille format</li>
              <li>Audio recording</li>
              <li>Sign language video</li>
              <li>Plain language summary</li>
            </ul>
            <p className="text-gray-700">
              Please contact us using the information above to request any of these formats.
            </p>
          </section>

          {/* Community Resources */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Resources</h2>
            <p className="text-gray-700 mb-4">
              We partner with local organizations to provide additional support and resources:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Local disability advocacy organizations</li>
              <li>Assistive technology training programs</li>
              <li>Transportation services for individuals with disabilities</li>
              <li>Support groups and peer networks</li>
              <li>Accessibility equipment lending library</li>
            </ul>
            <p className="text-gray-700">
              Contact us for information about these resources and how to access them.
            </p>
          </section>

          {/* Effective Date */}
          <section>
            <div className="bg-purple-50 p-6 rounded-lg">
              <p className="text-purple-800 font-semibold">
                This Accessibility Statement is effective as of {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}. We review and update this statement regularly to reflect our ongoing commitment 
                to accessibility and inclusion for all members of our community.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
} 