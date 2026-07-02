import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import SignatureCanvas, {
  type SignatureViewRef,
} from 'react-native-signature-canvas';

import { albaranesStyles } from '@/styles/albaranes.styles';

const signatureWebStyle = `
  .m-signature-pad {
    box-shadow: none;
    border: none;
  }
  .m-signature-pad--body {
    border: none;
  }
  .m-signature-pad--footer {
    display: none;
    margin: 0;
  }
  body, html {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    background: #ffffff;
    overflow: hidden;
    overscroll-behavior: none;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
  }
  canvas {
    touch-action: none;
  }
`;

export function SignaturePad({
  title,
  hint,
  onSave,
  onContinue,
  continueLabel,
  onGoBack,
  showBackButton = false,
  backLabel = 'Volver',
  disabled = false,
}: {
  title: string;
  hint: string;
  onSave: (signature: string) => void;
  onContinue: (signature: string) => void;
  continueLabel: string;
  onGoBack?: () => void;
  showBackButton?: boolean;
  backLabel?: string;
  disabled?: boolean;
}) {
  const signatureRef = useRef<SignatureViewRef>(null);
  const continueAfterSaveRef = useRef(false);
  const latestSignatureRef = useRef('');

  function handleSignatureSave(signature: string) {
    latestSignatureRef.current = signature;
    onSave(signature);

    if (continueAfterSaveRef.current) {
      continueAfterSaveRef.current = false;
      onContinue(signature);
    }
  }

  function handleEmptySignature() {
    continueAfterSaveRef.current = false;
    latestSignatureRef.current = '';
    onSave('');
  }

  return (
    <View>
      <Text style={albaranesStyles.sectionTitle}>{title}</Text>
      {hint ? <Text style={albaranesStyles.signatureHint}>{hint}</Text> : null}

      <View style={albaranesStyles.signatureBox}>
        <SignatureCanvas
          ref={signatureRef}
          androidLayerType="software"
          autoClear={false}
          backgroundColor="#FFFFFF"
          descriptionText=""
          imageType="image/png"
          onEmpty={handleEmptySignature}
          onError={handleEmptySignature}
          onOK={handleSignatureSave}
          penColor="#004B96"
          webStyle={signatureWebStyle}
        />
      </View>

      <View style={albaranesStyles.signatureActions}>
        {showBackButton ? (
          <Pressable
            disabled={disabled}
            onPress={onGoBack}
            style={[
              albaranesStyles.actionButton,
              albaranesStyles.secondaryButton,
              disabled && albaranesStyles.actionButtonDisabled,
            ]}>
            <Text style={albaranesStyles.actionButtonText}>{backLabel}</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => signatureRef.current?.clearSignature()}
          style={[
            albaranesStyles.actionButton,
            albaranesStyles.secondaryButton,
          ]}>
          <Text style={albaranesStyles.actionButtonText}>Limpiar firma</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            if (disabled) {
              return;
            }

            if (latestSignatureRef.current) {
              onSave(latestSignatureRef.current);
              onContinue(latestSignatureRef.current);
              return;
            }

            continueAfterSaveRef.current = true;
            signatureRef.current?.readSignature();
          }}
          style={[
            albaranesStyles.actionButton,
            disabled && albaranesStyles.actionButtonDisabled,
          ]}>
          <Text style={albaranesStyles.actionButtonText}>{continueLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}
