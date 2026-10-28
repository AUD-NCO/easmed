import React, { forwardRef, useState } from 'react';
import { Pressable, type TextInput, type TextInputProps } from 'react-native';
import { FormInput } from '@ds/components/Form';
import { Icon } from '@ds/components/Icon';

/**
 * A password, hidden as you type, with an eye at the end of the field to show it (44 pt target);
 * crossed out while it's shown, to hide it again. `isNew`: a new password, so the phone can offer a strong one and save it.
 */
export const PasswordField = forwardRef<TextInput, Omit<TextInputProps, 'style'> & { isNew?: boolean }>(function PasswordField({ isNew = false, ...input }, ref) {
  const [shown, setShown] = useState(false);
  return (
    <FormInput
      ref={ref}
      placeholder={isNew ? 'Create a password' : 'Password'}
      accessibilityLabel={isNew ? 'New password' : 'Password'}
      secureTextEntry={!shown}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete={isNew ? 'new-password' : 'current-password'}
      textContentType={isNew ? 'newPassword' : 'password'}
      {...input}
      trailing={
        <Pressable onPress={() => setShown((s) => !s)} hitSlop={8} accessibilityRole="button" accessibilityLabel={shown ? 'Hide password' : 'Show password'} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 }}>
          <Icon name={shown ? 'visibility_off' : 'visibility'} size={22} color="textMuted" />
        </Pressable>
      }
    />
  );
});
