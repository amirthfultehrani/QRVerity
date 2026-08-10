import { currentInput, currentValidationResult, selectedPayloadType } from '../../state/generator';
import { CalendarForm } from './forms/CalendarForm';
import { EmailForm } from './forms/EmailForm';
import { GeoForm } from './forms/GeoForm';
import { PhoneForm } from './forms/PhoneForm';
import { SmsForm } from './forms/SmsForm';
import { TextForm } from './forms/TextForm';
import { UrlForm } from './forms/UrlForm';
import { VCardForm } from './forms/VCardForm';
import { WifiForm } from './forms/WifiForm';
import { PayloadTypeSelector } from './PayloadTypeSelector';

export function ContentPanel() {
  const type = selectedPayloadType.value;
  const input = currentInput.value;
  const vResult = currentValidationResult.value;
  const issues = vResult.issues || [];

  const renderActiveForm = () => {
    switch (type) {
      case 'url':
        return <UrlForm input={input} issues={issues} />;
      case 'text':
        return <TextForm input={input} issues={issues} />;
      case 'wifi':
        return <WifiForm input={input} issues={issues} />;
      case 'email':
        return <EmailForm input={input} issues={issues} />;
      case 'phone':
        return <PhoneForm input={input} issues={issues} />;
      case 'sms':
        return <SmsForm input={input} issues={issues} />;
      case 'vcard':
        return <VCardForm input={input} issues={issues} />;
      case 'geo':
        return <GeoForm input={input} issues={issues} />;
      case 'calendar':
        return <CalendarForm input={input} issues={issues} />;
      default:
        return <UrlForm input={input} issues={issues} />;
    }
  };

  return (
    <section class="content-panel app-card" aria-labelledby="content-panel-heading">
      <h2 id="content-panel-heading" class="section-title">
        Create your QR
      </h2>
      <p class="panel-intro">Choose a type, then enter the content you want to share.</p>

      <div class="panel-section">
        <PayloadTypeSelector />
      </div>

      <div class="panel-section form-container">{renderActiveForm()}</div>
    </section>
  );
}
