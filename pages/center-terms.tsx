import Head from 'next/head'

export default function CenterTerms() {
  return (
    <>
      <Head>
        <title>Center Terms and Conditions - CCC Exam Portal</title>
        <meta name="description" content="Terms and conditions for centers using the CCC Exam Portal system." />
      </Head>

      <div className="min-vh-100 bg-gradient-primary">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Header */}
              <div className="text-center mb-5">
                <h1 className="display-4 text-white mb-4">
                  Center Terms and Conditions
                </h1>
                <p className="lead text-white-50">
                  Terms of service for examination centers
                </p>
              </div>

              {/* Terms Content */}
              <div className="card glass-card border-0 shadow-lg">
                <div className="card-body p-5">
                  
                  <div className="mb-4">
                    <p className="text-muted mb-4">
                      <strong>Effective Date:</strong> November 29, 2025<br />
                      <strong>Last Updated:</strong> November 29, 2025
                    </p>
                  </div>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">1. Center Authorization</h2>
                    <div className="ps-3">
                      <p>1.1. Centers must be officially authorized by Infonix Computers to conduct CCC examinations.</p>
                      <p>1.2. Authorization includes proper licensing, infrastructure verification, and staff training completion.</p>
                      <p>1.3. Centers must maintain valid accreditation and comply with all regulatory requirements.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">2. Infrastructure Requirements</h2>
                    <div className="ps-3">
                      <p>2.1. Centers must provide adequate computer facilities with minimum system requirements:</p>
                      <ul className="mb-3">
                        <li>Windows 10 or higher operating system</li>
                        <li>Minimum 4GB RAM, 8GB recommended</li>
                        <li>Stable internet connection (minimum 10 Mbps)</li>
                        <li>Updated web browsers (Chrome, Firefox, Edge)</li>
                        <li>Backup power supply (UPS/Generator)</li>
                      </ul>
                      <p>2.2. Examination hall must accommodate social distancing and surveillance requirements.</p>
                      <p>2.3. Centers must ensure adequate lighting, ventilation, and seating arrangements.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">3. Examination Conduct</h2>
                    <div className="ps-3">
                      <p>3.1. Centers must ensure fair and secure examination conditions.</p>
                      <p>3.2. Adequate supervision must be provided during examinations.</p>
                      <p>3.3. Any form of malpractice or cheating must be immediately reported.</p>
                      <p>3.4. Centers must maintain examination logs and incident reports.</p>
                      <p>3.5. Technical issues must be documented and reported to Infonix Computers immediately.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">4. Data Security and Privacy</h2>
                    <div className="ps-3">
                      <p>4.1. Centers must protect all student data and examination materials.</p>
                      <p>4.2. Access to the portal must be restricted to authorized personnel only.</p>
                      <p>4.3. Centers must not share login credentials or system access with unauthorized individuals.</p>
                      <p>4.4. All examination data must be handled in compliance with data protection regulations.</p>
                      <p>4.5. Centers must report any data breaches immediately to Infonix Computers.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">5. Financial Terms</h2>
                    <div className="ps-3">
                      <p>5.1. Centers must pay all fees as per the agreed fee structure.</p>
                      <p>5.2. Payment terms are as specified in the center agreement.</p>
                      <p>5.3. Late payment may result in suspension of examination privileges.</p>
                      <p>5.4. Refunds, if applicable, will be processed as per the refund policy.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">6. Quality Assurance</h2>
                    <div className="ps-3">
                      <p>6.1. Centers must maintain high standards of service delivery.</p>
                      <p>6.2. Regular quality audits may be conducted by Infonix Computers.</p>
                      <p>6.3. Centers must address any quality issues promptly.</p>
                      <p>6.4. Student feedback and complaints must be handled professionally.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">7. Liability and Insurance</h2>
                    <div className="ps-3">
                      <p>7.1. Centers are responsible for maintaining adequate insurance coverage.</p>
                      <p>7.2. Infonix Computers is not liable for any damages or losses at the center premises.</p>
                      <p>7.3. Centers must indemnify Infonix Computers against any third-party claims.</p>
                      <p>7.4. Force majeure events will be handled as per standard business practices.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">8. Termination</h2>
                    <div className="ps-3">
                      <p>8.1. Either party may terminate the agreement with 30 days written notice.</p>
                      <p>8.2. Immediate termination may occur in case of breach of terms.</p>
                      <p>8.3. Upon termination, all examination materials and data must be returned or destroyed.</p>
                      <p>8.4. Outstanding financial obligations must be settled before termination.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">9. Dispute Resolution</h2>
                    <div className="ps-3">
                      <p>9.1. Disputes will be resolved through mutual discussion and negotiation.</p>
                      <p>9.2. If unresolved, disputes will be subject to arbitration in Godhra, Gujarat.</p>
                      <p>9.3. The decision of the arbitrator will be final and binding.</p>
                      <p>9.4. All legal proceedings will be conducted in accordance with Indian law.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">10. Contact Information</h2>
                    <div className="ps-3">
                      <p>For any questions regarding these terms and conditions, please contact:</p>
                      <div className="bg-light p-3 rounded mt-3">
                        <strong>Infonix Computers</strong><br />
                        2nd Floor, Satguru Complex<br />
                        Opp. Jain Society, Godhra-389001<br />
                        Gujarat, INDIA<br /><br />
                        <strong>Tel:</strong> (02672) 243397, 253397<br />
                        <strong>Phone:</strong> 9377226363, 9429451524<br />
                        <strong>Email:</strong> infonixcomputers@gmail.com
                      </div>
                    </div>
                  </section>

                  <div className="alert alert-info">
                    <strong>Note:</strong> These terms and conditions are subject to change. Centers will be notified of any updates through official communication channels.
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