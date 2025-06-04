# Legal Compliance Documentation

## Overview

This document outlines Errors and Echoes' compliance with data protection regulations, including GDPR, data retention policies, and user rights. This module is designed with privacy-by-design principles to minimize legal compliance requirements while maximizing user protection.

---

## GDPR Compliance Statement

### Legal Basis for Processing

**Legitimate Interest (Article 6(1)(f) GDPR):** Error reporting serves the legitimate interest of improving software quality and user experience. This interest is balanced against user privacy through:

- Minimal data collection by design
- Anonymous processing only
- User control over all data sharing
- Clear opt-in consent requirements
- Transparent privacy information

### Data Processing Principles

#### 1. Lawfulness, Fairness, and Transparency

- ✅ Clear consent process with detailed explanations
- ✅ Transparent privacy levels and data collection
- ✅ No hidden data collection or processing
- ✅ User-friendly privacy controls

#### 2. Purpose Limitation

- ✅ Data used only for error reporting and bug fixing
- ✅ No secondary use for marketing or profiling
- ✅ Explicit purpose stated in all documentation

#### 3. Data Minimization

- ✅ Only essential error information is collected
- ✅ User choice of privacy levels (minimal to detailed)
- ✅ No personally identifiable information collected
- ✅ No world content or user-generated data collected

#### 4. Accuracy

- ✅ Technical error data is collected directly from browser
- ✅ No user-input data that could be inaccurate
- ✅ System information gathered from authenticated sources

#### 5. Storage Limitation

- ✅ Session IDs rotate daily
- ✅ Error reports processed for analysis, not long-term storage
- ✅ No permanent user identifiers maintained
- ✅ Data deletion handled by endpoint authors (documented)

#### 6. Integrity and Confidentiality

- ✅ HTTPS-only transmission required
- ✅ No local storage of personal data
- ✅ Anonymous processing prevents data breaches affecting individuals

### Data Subject Rights

#### Right to Information (Articles 13-14)

**Provided through:**

- Comprehensive privacy documentation
- Clear privacy level explanations
- Transparent consent process
- Example data reports shown to users

#### Right of Access (Article 15)

**Implementation:**

- Users can see example reports for their privacy level
- Test functionality shows exactly what data would be sent
- No personal identifiers means no individual data to access

#### Right to Rectification (Article 16)

**Not Applicable:** No personal data collected that could be inaccurate

#### Right to Erasure (Article 17)

**Implementation:**

- Users can disable error reporting to stop new data collection
- Anonymous processing means no individual data to erase
- Data deletion requests should be directed to endpoint authors

#### Right to Restrict Processing (Article 18)

**Implementation:**

- Users can disable specific endpoints while keeping others enabled
- Users can change privacy levels to restrict data collection
- Complete opt-out available at any time

#### Right to Data Portability (Article 20)

**Not Applicable:** Anonymous error data is not personal data subject to portability rights

#### Right to Object (Article 21)

**Implementation:**

- Clear opt-out mechanisms in module settings
- No legitimate interest override (users always win)
- Granular control over different data recipients

### Data Protection by Design and Default

#### Technical Measures

- **Anonymous by design:** No user identifiers collected
- **Local processing:** Error attribution happens locally
- **User control:** All settings stored locally, user-controlled
- **Secure transmission:** HTTPS required for all endpoints

#### Organizational Measures

- **Privacy documentation:** Comprehensive user education
- **Consent management:** Clear opt-in and control mechanisms
- **Transparency:** Open source code and documentation
- **Regular review:** Documentation updated with any changes

---

## Data Retention Policy

### Data Categories and Retention

#### Error Reports

- **Type:** Anonymous technical error information
- **Retention:** Determined by individual endpoint authors
- **Recommended Maximum:** 12 months for debugging purposes
- **Deletion:** Automatic by endpoint design (no user identifiers to link)

#### User Consent Records

- **Type:** Local consent preferences and settings
- **Retention:** Until user changes settings or uninstalls module
- **Storage:** Local Foundry VTT client only
- **Deletion:** Automatic when module uninstalled

#### Session Identifiers

- **Type:** Daily rotating anonymous session IDs
- **Retention:** Maximum 24 hours (automatic rotation)
- **Purpose:** Correlate errors within single session only
- **Deletion:** Automatic daily rotation

### Data Deletion Procedures

#### User-Initiated Deletion

1. **Disable Error Reporting:** Stops all new data collection
2. **Revoke Consent:** Clears local consent settings
3. **Module Removal:** Deletes all local settings and preferences

#### Automatic Deletion

- Session IDs automatically rotate daily
- No permanent user identifiers to accumulate
- Local settings cleared on module uninstall

#### Endpoint Author Responsibilities

Each endpoint author must:

- Implement appropriate data retention policies
- Provide data deletion mechanisms if requested
- Document their data handling practices
- Comply with applicable data protection laws

---

## User Rights Documentation

### Summary of Rights

Users have comprehensive control over their data through:

#### Access Rights

- **See Privacy Levels:** Detailed explanation of each level
- **Example Reports:** Preview exactly what data would be sent
- **Test Functionality:** Send test reports to verify data collection

#### Control Rights

- **Enable/Disable:** Master control over all error reporting
- **Privacy Levels:** Choose minimal, standard, or detailed data collection
- **Endpoint Control:** Enable/disable specific author endpoints
- **Granular Settings:** Control individual aspects of data collection

#### Information Rights

- **Transparent Processing:** Clear explanation of all data uses
- **Contact Information:** Clear contact points for questions
- **Documentation:** Comprehensive privacy and technical documentation

### Exercising Rights

#### To Control Data Collection

1. Open Foundry VTT Settings
2. Navigate to Module Settings → Errors and Echoes
3. Use the privacy controls to adjust or disable reporting

#### To Get Information

1. Read the Privacy Details dialog in the module
2. Review this legal documentation
3. Contact privacy@rayners.dev for specific questions

#### To Delete Data

1. Disable error reporting to stop new collection
2. Contact endpoint authors for historical data deletion
3. Uninstall module to remove all local settings

#### To Report Concerns

- **Privacy issues:** privacy@rayners.dev
- **Security issues:** security@rayners.dev
- **General questions:** GitHub Issues

---

## Cookie and Storage Policy

### Local Data Storage

#### Foundry VTT Module Settings

- **Purpose:** Store user privacy preferences and consent status
- **Type:** Local browser storage managed by Foundry VTT
- **Retention:** Until user changes settings or uninstalls module
- **Access:** Local user only, not transmitted

#### Session Data

- **Purpose:** Anonymous session correlation for error grouping
- **Type:** Randomly generated daily identifiers
- **Retention:** Maximum 24 hours (automatic rotation)
- **Transmission:** Included in error reports if user consents

### No Cookies Policy

This module does not set any cookies. All user preferences are stored in Foundry VTT's secure module settings system.

### Third-Party Data Sharing

#### Endpoint Authors

- **Who:** Module authors who configure error reporting endpoints
- **What:** Only the error data that users consent to share
- **Why:** To enable module authors to fix bugs and improve software
- **Control:** Users can enable/disable specific endpoints

#### No Other Sharing

- No data is shared with advertising networks
- No data is shared with analytics services
- No data is shared with social media platforms
- No data is sold or monetized

---

## Privacy Impact Assessment

### Risk Assessment

#### High Privacy Risks: NONE

- ✅ No personal identifiers collected
- ✅ No sensitive personal data involved
- ✅ No behavioral tracking or profiling
- ✅ No data monetization or selling

#### Medium Privacy Risks: MINIMAL

- ⚠️ Technical system information revealed to authors
  - **Mitigation:** User choice of privacy levels
  - **Control:** Users can choose minimal information sharing
- ⚠️ Module usage patterns could be inferred
  - **Mitigation:** No user identifiers to link patterns
  - **Control:** Anonymous by design prevents tracking

#### Low Privacy Risks: WELL-CONTROLLED

- ⚠️ Error messages might contain world/scene names
  - **Mitigation:** Only in detailed privacy level
  - **Control:** Users can choose standard or minimal levels
- ⚠️ Browser information shared for debugging
  - **Mitigation:** Only technical browser version, not fingerprinting
  - **Control:** Only in detailed level, user choice

### Privacy Protection Measures

#### Technical Protections

- **Anonymous processing:** No personal identifiers
- **Secure transmission:** HTTPS required
- **Local control:** Settings stored locally
- **Data minimization:** Only error-relevant information

#### User Control Measures

- **Informed consent:** Detailed privacy explanations
- **Granular control:** Multiple privacy levels and endpoint controls
- **Easy opt-out:** One-click disable in settings
- **Transparency:** Complete visibility into data collection

#### Organizational Measures

- **Open source:** Code is publicly auditable
- **Documentation:** Comprehensive privacy documentation
- **Responsive support:** Clear contact points for concerns
- **Regular review:** Documentation kept current

### Conclusion

The privacy impact assessment concludes that Errors and Echoes presents minimal privacy risks due to its anonymous-by-design architecture and comprehensive user controls. The benefits of improved module quality justify the minimal technical data collection, especially given users' complete control over participation.

---

## Legal Contact Information

### Data Protection Contacts

**Privacy Officer:** David Raynes

- **Email:** privacy@rayners.dev
- **Role:** Privacy policy questions, data subject rights
- **Response Time:** 5 business days

**Security Officer:** David Raynes

- **Email:** security@rayners.dev
- **Role:** Security vulnerabilities, data breaches
- **Response Time:** 48 hours for security issues

### Legal Jurisdiction

This module is developed and maintained under:

- **Jurisdiction:** United States
- **State Law:** Maryland State
- **Federal Law:** Applicable US federal privacy laws
- **International:** GDPR compliance for EU users

### Dispute Resolution

For legal disputes or formal complaints:

1. **First Contact:** privacy@rayners.dev for informal resolution
2. **EU Users:** Right to lodge complaints with supervisory authorities
3. **US Users:** Contact appropriate state attorney general offices
4. **General:** Standard legal processes apply

---

## Compliance Monitoring

### Regular Review Schedule

- **Quarterly:** Review privacy controls and user feedback
- **Semi-annually:** Update legal compliance documentation
- **Annually:** Complete privacy impact assessment review
- **As needed:** Updates for legal changes or new features

### Change Management

Any changes affecting data collection or user privacy will:

1. Be documented in updated privacy documentation
2. Require new user consent if materially different
3. Be announced through standard module update channels
4. Maintain backward compatibility for existing user choices

### Audit Compliance

This module maintains compliance through:

- **Code auditing:** Open source enables community review
- **Documentation:** Comprehensive legal and privacy documentation
- **User feedback:** Responsive to privacy concerns and questions
- **Legal review:** Regular review of changing privacy law requirements

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Next Review:** March 2025  
**Applicable Laws:** GDPR, CCPA, applicable US state privacy laws
