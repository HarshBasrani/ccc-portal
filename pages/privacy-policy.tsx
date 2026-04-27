import Head from 'next/head'

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - CCC Exam Portal</title>
        <meta name="description" content="Privacy policy and data protection information for CCC Exam Portal users." />
      </Head>

      <div className="min-vh-100 bg-gradient-primary">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Header */}
              <div className="text-center mb-5">
                <h1 className="display-4 text-white mb-4">
                  Privacy Policy
                </h1>
                <p className="lead text-white-50">
                  How we protect and handle your personal information
                </p>
              </div>

              {/* Privacy Policy Content */}
              <div className="card glass-card border-0 shadow-lg">
                <div className="card-body p-5">
                  
                  <div className="mb-4">
                    <p className="text-muted mb-4">
                      <strong>Effective Date:</strong> November 29, 2025<br />
                      <strong>Last Updated:</strong> November 29, 2025
                    </p>
                    <p>
                      Infonix Computers respects your privacy and is committed to protecting your personal data. 
                      This privacy policy explains how we collect, use, and safeguard your information when you use our CCC Exam Portal.
                    </p>
                  </div>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">1. Information We Collect</h2>
                    <div className="ps-3">
                      <h4 className="h5 mb-2">Personal Information:</h4>
                      <ul className="mb-3">
                        <li>Full name and contact details</li>
                        <li>Email address and phone number</li>
                        <li>Date of birth and gender</li>
                        <li>Educational qualifications</li>
                        <li>Government-issued identification details</li>
                        <li>Photographs for identification purposes</li>
                      </ul>
                      
                      <h4 className="h5 mb-2">Examination Data:</h4>
                      <ul className="mb-3">
                        <li>Examination responses and scores</li>
                        <li>Time stamps and session logs</li>
                        <li>Browser and system information</li>
                        <li>IP addresses for security purposes</li>
                      </ul>

                      <h4 className="h5 mb-2">Technical Information:</h4>
                      <ul>
                        <li>Device type and operating system</li>
                        <li>Browser type and version</li>
                        <li>Screen resolution and settings</li>
                        <li>Cookies and local storage data</li>
                      </ul>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">2. How We Use Your Information</h2>
                    <div className="ps-3">
                      <p>We use your personal information for the following purposes:</p>
                      <ul>
                        <li><strong>Examination Administration:</strong> To conduct and manage online examinations</li>
                        <li><strong>Identity Verification:</strong> To verify candidate identity and prevent fraud</li>
                        <li><strong>Result Processing:</strong> To calculate scores and generate certificates</li>
                        <li><strong>Communication:</strong> To send important updates and notifications</li>
                        <li><strong>Technical Support:</strong> To provide assistance and troubleshoot issues</li>
                        <li><strong>Quality Assurance:</strong> To monitor and improve our services</li>
                        <li><strong>Legal Compliance:</strong> To comply with regulatory requirements</li>
                      </ul>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">3. Data Sharing and Disclosure</h2>
                    <div className="ps-3">
                      <p>We may share your information with:</p>
                      <ul>
                        <li><strong>Authorized Centers:</strong> Your registered examination center</li>
                        <li><strong>Certification Bodies:</strong> Organizations that issue CCC certificates</li>
                        <li><strong>Government Agencies:</strong> As required by law or regulation</li>
                        <li><strong>Service Providers:</strong> Technical partners who help deliver our services</li>
                        <li><strong>Legal Authorities:</strong> When required by court orders or legal processes</li>
                      </ul>
                      <p className="mt-3">
                        <strong>We do not sell, rent, or trade your personal information to third parties for commercial purposes.</strong>
                      </p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">4. Data Security</h2>
                    <div className="ps-3">
                      <p>We implement comprehensive security measures to protect your data:</p>
                      <ul>
                        <li><strong>Encryption:</strong> All data transmission is encrypted using SSL/TLS protocols</li>
                        <li><strong>Access Control:</strong> Strict access controls limit who can view your information</li>
                        <li><strong>Secure Servers:</strong> Data is stored on secure, regularly monitored servers</li>
                        <li><strong>Regular Audits:</strong> We conduct regular security assessments and updates</li>
                        <li><strong>Staff Training:</strong> Our staff are trained in data protection best practices</li>
                        <li><strong>Backup Systems:</strong> Secure backup systems ensure data availability</li>
                      </ul>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">5. Data Retention</h2>
                    <div className="ps-3">
                      <p>We retain your information for the following periods:</p>
                      <ul>
                        <li><strong>Examination Records:</strong> 7 years from examination date</li>
                        <li><strong>Personal Information:</strong> 5 years after last activity</li>
                        <li><strong>Certificate Data:</strong> Permanently for verification purposes</li>
                        <li><strong>Technical Logs:</strong> 1 year for security monitoring</li>
                        <li><strong>Communication Records:</strong> 3 years for customer service</li>
                      </ul>
                      <p className="mt-3">
                        After the retention period, data is securely deleted or anonymized.
                      </p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">6. Your Rights</h2>
                    <div className="ps-3">
                      <p>You have the following rights regarding your personal data:</p>
                      <ul>
                        <li><strong>Access:</strong> Request copies of your personal information</li>
                        <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                        <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
                        <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                        <li><strong>Restriction:</strong> Request limitation of data processing</li>
                        <li><strong>Objection:</strong> Object to certain types of data processing</li>
                        <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
                      </ul>
                      <p className="mt-3">
                        To exercise these rights, please contact us using the information provided below.
                      </p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">7. Cookies and Tracking</h2>
                    <div className="ps-3">
                      <p>Our website uses cookies and similar technologies:</p>
                      <ul>
                        <li><strong>Essential Cookies:</strong> Required for basic website functionality</li>
                        <li><strong>Session Cookies:</strong> To maintain your login session</li>
                        <li><strong>Security Cookies:</strong> To protect against fraud and unauthorized access</li>
                        <li><strong>Analytics Cookies:</strong> To understand how you use our website</li>
                      </ul>
                      <p className="mt-3">
                        You can control cookie settings through your browser preferences.
                      </p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">8. Third-Party Links</h2>
                    <div className="ps-3">
                      <p>
                        Our website may contain links to third-party websites. We are not responsible for 
                        the privacy practices of these external sites. We encourage you to review their 
                        privacy policies before providing any personal information.
                      </p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">9. Children's Privacy</h2>
                    <div className="ps-3">
                      <p>
                        Our services are not intended for children under 13 years of age. We do not 
                        knowingly collect personal information from children under 13. If we become 
                        aware of such collection, we will delete the information immediately.
                      </p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">10. Updates to This Policy</h2>
                    <div className="ps-3">
                      <p>
                        We may update this privacy policy from time to time to reflect changes in our 
                        practices or legal requirements. We will notify you of any material changes 
                        through email or prominent notices on our website.
                      </p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">11. Contact Information</h2>
                    <div className="ps-3">
                      <p>For any privacy-related questions or concerns, please contact us:</p>
                      <div className="bg-light p-3 rounded mt-3">
                        <strong>Data Protection Officer</strong><br />
                        <strong>Infonix Computers</strong><br />
                        2nd Floor, Satguru Complex<br />
                        Opp. Jain Society, Godhra-389001<br />
                        Gujarat, INDIA<br /><br />
                        <strong>Tel:</strong> (02672) 243397, 253397<br />
                        <strong>Phone:</strong> 9377226363, 9429451524<br />
                        <strong>Email:</strong> infonixcomputers@gmail.com<br />
                        <strong>Privacy Email:</strong> privacy@infonixcomputers.com
                      </div>
                    </div>
                  </section>

                  <div className="alert alert-info">
                    <strong>Note:</strong> This privacy policy is governed by Indian law and complies with applicable data protection regulations.
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}