import { useState, useRef, useEffect } from 'react';
import { FileText, Check, X, Download } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import './IndemnityFormSigner.css';

const IndemnityFormSigner = ({
  serviceType = 'gym',
  customer,
  onSign,
  onCancel,
  existingForm = null,
  readOnly = false
}) => {
  const [signature, setSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [emergencyConsent, setEmergencyConsent] = useState(false);
  const [photoRelease, setPhotoRelease] = useState(false);
  const [medicalConsent, setMedicalConsent] = useState(false);
  const [liabilityWaiver, setLiabilityWaiver] = useState(false);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  useEffect(() => {
    if (existingForm) {
      setAgreedToTerms(existingForm.agreedToTerms);
      setEmergencyConsent(existingForm.emergencyConsentGiven || false);
      setPhotoRelease(existingForm.photoReleaseConsent || false);
      setMedicalConsent(existingForm.medicalConsentGiven || false);
      setLiabilityWaiver(existingForm.liabilityWaiverAccepted || false);

      // Load existing signature
      if (existingForm.digitalSignature) {
        setSignature(existingForm.digitalSignature);
      }
    }
  }, [existingForm]);

  useEffect(() => {
    // Add a small delay to ensure the modal/canvas is fully rendered
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Get the actual rendered dimensions
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const context = canvas.getContext('2d');
      context.scale(2, 2);
      context.lineCap = 'round';
      context.strokeStyle = 'black';
      context.lineWidth = 2;
      contextRef.current = context;

      // Load existing signature image if available
      if (signature && readOnly) {
        const img = new Image();
        img.onload = () => {
          context.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = signature;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [customer, serviceType, signature, readOnly]);

  const startDrawing = ({ nativeEvent }) => {
    if (readOnly || !contextRef.current) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || readOnly || !contextRef.current) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignature(canvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  };

  const handleSubmit = async () => {
    if (!signature) {
      alert('Please provide your signature');
      return;
    }

    if (!agreedToTerms) {
      alert('You must agree to the terms and conditions');
      return;
    }

    // Service-specific validation
    if (serviceType === 'childcare' && !emergencyConsent) {
      alert('Emergency consent is required for childcare services');
      return;
    }

    if ((serviceType === 'gym' || serviceType === 'guest_pass') && !liabilityWaiver) {
      alert('Liability waiver must be accepted for gym services');
      return;
    }

    setLoading(true);

    const formData = {
      digitalSignature: signature,
      agreedToTerms,
      emergencyConsentGiven: emergencyConsent,
      photoReleaseConsent: photoRelease,
      medicalConsentGiven: medicalConsent,
      liabilityWaiverAccepted: liabilityWaiver,
      serviceType,
      customer: customer?._id || customer
    };

    try {
      await onSign(formData);
    } catch (error) {
      console.error('Error signing form:', error);
      alert('Failed to sign indemnity form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getServiceTerms = () => {
    switch (serviceType) {
      case 'childcare':
        return {
          title: 'Childcare Indemnity Form',
          terms: [
            'I understand that my child will be supervised by qualified childcare staff.',
            'I authorize staff to seek medical treatment in case of emergency.',
            'I agree to pick up my child at the designated time.',
            'I understand that late pickup fees may apply.',
            'I certify that all medical information provided is accurate.'
          ],
          requiredConsents: ['emergencyConsent']
        };
      case 'gym':
        return {
          title: 'Gym Membership Liability Waiver',
          terms: [
            'I understand that gym activities involve inherent risks.',
            'I acknowledge that I am in good physical condition to participate.',
            'I agree to use equipment properly and follow all safety guidelines.',
            'I release Women\'s Den from any liability for injury or loss.',
            'I will inform staff immediately of any health concerns or injuries.'
          ],
          requiredConsents: ['liabilityWaiver', 'medicalConsent']
        };
      case 'guest_pass':
        return {
          title: 'Guest Pass Liability Waiver',
          terms: [
            'I am a guest of a Women\'s Den member and agree to follow all rules.',
            'I understand that gym activities involve inherent risks.',
            'I acknowledge that I am in good physical condition to participate.',
            'I release Women\'s Den from any liability for injury or loss.',
            'I agree to respect other members and maintain gym etiquette.'
          ],
          requiredConsents: ['liabilityWaiver']
        };
      case 'spa':
        return {
          title: 'Spa Service Consent Form',
          terms: [
            'I understand the nature of the treatments I will receive.',
            'I have disclosed all medical conditions and allergies.',
            'I consent to the spa treatments and services.',
            'I release the spa from liability for any adverse reactions.',
            'I understand that results may vary.'
          ],
          requiredConsents: ['medicalConsent']
        };
      default:
        return {
          title: 'Indemnity Form',
          terms: [],
          requiredConsents: []
        };
    }
  };

  const serviceInfo = getServiceTerms();

  return (
    <Card className="indemnity-form-signer">
      <div className="indemnity-header">
        <FileText size={32} className="indemnity-icon" />
        <h2>{serviceInfo.title}</h2>
        {customer && (
          <p className="customer-name">
            {customer.firstName} {customer.lastName}
          </p>
        )}
      </div>

      <div className="indemnity-content">
        <div className="terms-section">
          <h3>Terms and Conditions</h3>
          <div className="terms-list">
            {serviceInfo.terms.map((term, index) => (
              <div key={index} className="term-item">
                <Check size={16} className="term-check" />
                <p>{term}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="consents-section">
          <h3>Required Consents</h3>

          <label className="consent-checkbox">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              disabled={readOnly}
              required
            />
            <span className="required">
              I have read and agree to all terms and conditions *
            </span>
          </label>

          {serviceInfo.requiredConsents.includes('emergencyConsent') && (
            <label className="consent-checkbox">
              <input
                type="checkbox"
                checked={emergencyConsent}
                onChange={(e) => setEmergencyConsent(e.target.checked)}
                disabled={readOnly}
                required
              />
              <span className="required">
                I authorize emergency medical treatment if necessary *
              </span>
            </label>
          )}

          {serviceInfo.requiredConsents.includes('liabilityWaiver') && (
            <label className="consent-checkbox">
              <input
                type="checkbox"
                checked={liabilityWaiver}
                onChange={(e) => setLiabilityWaiver(e.target.checked)}
                disabled={readOnly}
                required
              />
              <span className="required">
                I accept all liability and waive claims against Women's Den *
              </span>
            </label>
          )}

          {serviceInfo.requiredConsents.includes('medicalConsent') && (
            <label className="consent-checkbox">
              <input
                type="checkbox"
                checked={medicalConsent}
                onChange={(e) => setMedicalConsent(e.target.checked)}
                disabled={readOnly}
                required
              />
              <span className="required">
                I have disclosed all relevant medical conditions *
              </span>
            </label>
          )}

          <label className="consent-checkbox">
            <input
              type="checkbox"
              checked={photoRelease}
              onChange={(e) => setPhotoRelease(e.target.checked)}
              disabled={readOnly}
            />
            <span>
              I consent to photos being taken for progress tracking (optional)
            </span>
          </label>
        </div>

        <div className="signature-section">
          <h3>Digital Signature</h3>
          {readOnly ? (
            signature ? (
              <div className="signature-preview">
                <img src={signature} alt="Digital signature" />
              </div>
            ) : (
              <p className="signature-placeholder">Signature captured electronically</p>
            )
          ) : (
            <>
              <div className="signature-canvas-container">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="signature-canvas"
                />
                {!signature && (
                  <div className="signature-placeholder">
                    Sign here
                  </div>
                )}
              </div>
              <Button
                variant="secondary"
                size="small"
                onClick={clearSignature}
                className="clear-signature-btn"
              >
                Clear Signature
              </Button>
            </>
          )}
        </div>

        {existingForm && (
          <div className="form-info">
            <p><strong>Form ID:</strong> {existingForm.formId}</p>
            <p><strong>Signed:</strong> {new Date(existingForm.signedDate).toLocaleString()}</p>
            <p><strong>Status:</strong> {existingForm.status}</p>
          </div>
        )}
      </div>

      <div className="indemnity-actions">
        {!readOnly ? (
          <>
            <Button
              variant="secondary"
              icon={X}
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={Check}
              onClick={handleSubmit}
              loading={loading}
              disabled={!signature || !agreedToTerms}
            >
              Sign and Submit
            </Button>
          </>
        ) : (
          <Button
            variant="secondary"
            icon={Download}
            onClick={() => window.open(existingForm?.pdfUrl || '#', '_blank')}
          >
            Download PDF
          </Button>
        )}
      </div>
    </Card>
  );
};

export default IndemnityFormSigner;
