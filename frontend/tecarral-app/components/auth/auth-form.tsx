import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppColors } from '@/constants/theme';

type Field = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  textContentType?: 'none' | 'emailAddress' | 'password' | 'newPassword';
};

type AuthFormProps = {
  title: string;
  fields: Field[];
  buttonLabel: string;
  onSubmit: () => void;
  disabled?: boolean;
  feedback?: string | null;
  feedbackTone?: 'error' | 'success';
};

export function AuthForm({
  title,
  fields,
  buttonLabel,
  onSubmit,
  disabled = false,
  feedback,
  feedbackTone = 'error',
}: AuthFormProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <View style={styles.card}>
        <Image
          source={require('@/assets/images/tecarral-logo.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>{title}</Text>

        <View style={styles.fieldsContainer}>
          {fields.map((field) => (
            <View key={field.label} style={styles.fieldWrapper}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                autoCapitalize={field.autoCapitalize ?? 'none'}
                autoCorrect={false}
                keyboardType={field.keyboardType}
                placeholder=""
                placeholderTextColor={AppColors.primary50}
                secureTextEntry={field.secureTextEntry}
                selectionColor={AppColors.primary}
                style={styles.input}
                textContentType={field.textContentType}
                value={field.value}
                onChangeText={field.onChangeText}
              />
            </View>
          ))}
        </View>

        {feedback ? (
          <Text
            style={[
              styles.feedback,
              feedbackTone === 'error' ? styles.feedbackError : styles.feedbackSuccess,
            ]}>
            {feedback}
          </Text>
        ) : null}

        <Pressable
          disabled={disabled}
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={onSubmit}>
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    paddingHorizontal: 34,
  },
  card: {
    alignItems: 'center',
  },
  logo: {
    width: 230,
    height: 70,
    marginBottom: 26,
  },
  title: {
    color: AppColors.text,
    fontSize: 21,
    fontWeight: '500',
    marginBottom: 34,
  },
  fieldsContainer: {
    width: '100%',
    gap: 22,
  },
  fieldWrapper: {
    width: '100%',
  },
  label: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 44,
    borderRadius: 7,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: AppColors.primary50,
    backgroundColor: AppColors.secondary65,
    color: AppColors.inputText,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  feedback: {
    alignSelf: 'stretch',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
    textAlign: 'center',
  },
  feedbackError: {
    color: AppColors.error,
  },
  feedbackSuccess: {
    color: AppColors.success,
  },
  button: {
    minWidth: 138,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.secondary,
    marginTop: 28,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: AppColors.primary,
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
});
