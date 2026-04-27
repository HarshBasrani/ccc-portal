import Head from 'next/head'

export default function StudentTerms() {
  return (
    <>
      <Head>
        <title>Student Terms and Conditions - CCC Exam Portal</title>
        <meta name="description" content="Terms and conditions for students using the CCC Exam Portal." />
      </Head>

      <div className="min-vh-100 bg-gradient-primary">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Header */}
              <div className="text-center mb-5">
                <h1 className="display-4 text-white mb-4">
                  Student Terms and Conditions
                </h1>
                <p className="lead text-white-50">
                  Terms of service for students using CCC Exam Portal
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
                    <h2 className="h3 text-primary mb-3">1. Registration and Enrollment</h2>
                    <div className="ps-3">
                      <p>1.1. Students must register through authorized Infonix Computers centers only.</p>
                      <p>1.2. All information provided during registration must be accurate and complete.</p>
                      <p>1.3. Students are responsible for maintaining the confidentiality of their login credentials.</p>
                      <p>1.4. False or misleading information may result in disqualification from examinations.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">2. Examination Rules</h2>
                    <div className="ps-3">
                      <p>2.1. Students must arrive at the examination center at least 15 minutes before the scheduled time.</p>
                      <p>2.2. Valid government-issued photo identification is mandatory for examination.</p>
                      <p>2.3. Students must follow all instructions provided by the examination supervisor.</p>
                      <p>2.4. Use of mobile phones, calculators, or any unauthorized materials is strictly prohibited.</p>
                      <p>2.5. Students must not attempt to access unauthorized websites or applications during the exam.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">3. Code of Conduct</h2>
                    <div className="ps-3">
                      <p>3.1. Students must maintain discipline and decorum during examinations.</p>
                      <p>3.2. Any form of malpractice, cheating, or unfair means is strictly prohibited:</p>
                      <ul className="mb-3">
                        <li>Copying from other students or unauthorized sources</li>
                        <li>Communication with other candidates during the exam</li>
                        <li>Using external devices or software</li>
                        <li>Impersonation or proxy attendance</li>
                        <li>Disrupting other candidates or the examination process</li>
                      </ul>
                      <p>3.3. Violation of conduct rules may result in immediate disqualification.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">4. Technical Requirements</h2>
                    <div className="ps-3">
                      <p>4.1. Students are responsible for familiarizing themselves with the examination interface.</p>
                      <p>4.2. Technical difficulties should be reported immediately to the supervisor.</p>
                      <p>4.3. Students should not attempt to troubleshoot technical issues independently.</p>
                      <p>4.4. Time lost due to technical issues may be compensated at the discretion of the center.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">5. Fees and Payments</h2>
                    <div className="ps-3">
                      <p>5.1. All examination fees must be paid in full before the examination date.</p>
                      <p>5.2. Fees are non-refundable except under special circumstances as determined by Infonix Computers.</p>
                      <p>5.3. Students are responsible for any additional charges for rescheduling or re-examination.</p>
                      <p>5.4. Receipt of payment must be retained for all transactions.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">6. Results and Certification</h2>
                    <div className="ps-3">
                      <p>6.1. Results will be available through the portal after processing is complete.</p>
                      <p>6.2. Certificates will be issued based on successful completion of examinations.</p>
                      <p>6.3. Students must verify their personal details before certificate generation.</p>
                      <p>6.4. Duplicate certificates may be issued upon payment of prescribed fees.</p>
                      <p>6.5. Infonix Computers reserves the right to withhold certificates in case of violations.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">7. Privacy and Data Protection</h2>
                    <div className="ps-3">
                      <p>7.1. Personal information provided will be used solely for examination and certification purposes.</p>
                      <p>7.2. Student data will be protected in accordance with applicable privacy laws.</p>
                      <p>7.3. Information may be shared with authorized examination bodies and government agencies as required.</p>
                      <p>7.4. Students have the right to access and correct their personal information.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">8. Rescheduling and Cancellation</h2>
                    <div className="ps-3">
                      <p>8.1. Examination rescheduling requests must be made at least 48 hours in advance.</p>
                      <p>8.2. Rescheduling fees may apply as per the center's policy.</p>
                      <p>8.3. Emergency rescheduling will be considered on a case-by-case basis.</p>
                      <p>8.4. No-shows without prior notice will forfeit their examination fees.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">9. Grievances and Appeals</h2>
                    <div className="ps-3">
                      <p>9.1. Students may raise grievances regarding examination conduct or results.</p>
                      <p>9.2. Grievances must be submitted in writing within 7 days of the incident.</p>
                      <p>9.3. Appeals will be reviewed by a designated committee.</p>
                      <p>9.4. Decisions made by the appeal committee will be final and binding.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">10. Limitation of Liability</h2>
                    <div className="ps-3">
                      <p>10.1. Infonix Computers will not be liable for any indirect or consequential damages.</p>
                      <p>10.2. The company's liability is limited to the examination fees paid by the student.</p>
                      <p>10.3. Students participate in examinations at their own risk.</p>
                      <p>10.4. Force majeure events are beyond the control of Infonix Computers.</p>
                    </div>
                  </section>

                  <section className="mb-5">
                    <h2 className="h3 text-primary mb-3">11. Contact Information</h2>
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

                  <div className="alert alert-warning">
                    <strong>Important:</strong> By using the CCC Exam Portal, students acknowledge that they have read, understood, and agree to abide by these terms and conditions.
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