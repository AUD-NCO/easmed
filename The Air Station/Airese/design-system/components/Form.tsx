import React, { createContext, forwardRef, useContext, useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, radius, space, type } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

/**
 * Native-style grouped form (the iOS Settings / Contacts pattern), in Airese colours.
 *
 *   <FormGroup title="Name">
 *     <FormInput placeholder="First name" />
 *     <FormDivider />
 *     <FormInput placeholder="Last name" />
 *   </FormGroup>
 *
 * Each group: a small title above, a rounded Deep card of plain native inputs separated by
 * hairlines, and an optional footer (helper text, or an error with icon). The card outlines in
 * Breath while one of its inputs is focused, and in error red when the group has an error.
 */

const FocusContext = createContext<(focused: boolean) => void>(() => {});

type GroupProps = {
  title: string;
  /** Small control at the end of the title row (e.g. an info button). */
  titleAction?: React.ReactNode;
  footer?: string;
  /** Replaces the footer and outlines the card in error red. */
  error?: string;
  /** Lay inputs out in a row (date of birth) instead of stacked. */
  row?: boolean;
  /** Inside a bottom sheet (Deep): the card takes the app background so it still stands out. */
  onSheet?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function FormGroup({ title, titleAction, footer, error, row, onSheet, children, style }: GroupProps) {
  const [focused, setFocused] = useState(0); // count, so moving between inputs in a group doesn't flicker
  const onFocusChange = (f: boolean) => setFocused((n) => Math.max(0, n + (f ? 1 : -1)));
  const ring = error ? colors.errorMark : focused > 0 ? colors.accent : 'transparent';

  return (
    <View style={style}>
      <FormTitle title={title} action={titleAction} />

      <FocusContext.Provider value={onFocusChange}>
        <View style={[styles.card, row && styles.cardRow, onSheet && { backgroundColor: colors.background }, { borderColor: ring }]}>{children}</View>
      </FocusContext.Provider>

      {(error || footer) && (
        <View style={styles.footer}>
          {error && <Icon name="error" size={16} color="errorMark" />}
          <AppText variant="small" color={error ? 'error' : 'textMuted'} style={{ flex: 1 }} accessibilityLiveRegion={error ? 'polite' : 'none'}>
            {error ?? footer}
          </AppText>
        </View>
      )}
    </View>
  );
}

/**
 * The one section label: small, uppercase, Mist, 1 pt tracking. Form groups, tile sections, list
 * sections and chip groups (Night Notes remedies) all use it.
 */
export function FormTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.titleRow}>
      <AppText variant="small" color="textMuted" style={styles.title} accessibilityRole="header">
        {title}
      </AppText>
      {action}
    </View>
  );
}

type InputProps = Omit<TextInputProps, 'style'> & {
  /** Something small at the start of the row (e.g. the phone's country code chip). */
  leading?: React.ReactNode;
  /** Something small at the end of the row (e.g. a text button). */
  trailing?: React.ReactNode;
  style?: ViewStyle;
};

/** A plain native text input row. The placeholder names the field; the group title gives context. */
export const FormInput = forwardRef<TextInput, InputProps>(function FormInput({ leading, trailing, style, onFocus, onBlur, ...input }, ref) {
  const setGroupFocus = useContext(FocusContext);
  return (
    <View style={[styles.inputRow, style]}>
      {leading}
      <TextInput
        ref={ref}
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        keyboardAppearance="dark"
        maxFontSizeMultiplier={2}
        accessibilityLabel={input.accessibilityLabel ?? input.placeholder}
        onFocus={(e) => {
          setGroupFocus(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setGroupFocus(false);
          onBlur?.(e);
        }}
        {...input}
      />
      {trailing}
    </View>
  );
});

/** Hairline between rows (horizontal), or between inputs in a row group (vertical). */
export function FormDivider({ vertical }: { vertical?: boolean }) {
  return <View style={vertical ? styles.dividerV : styles.dividerH} />;
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 28, marginBottom: space.sm, paddingHorizontal: space.xs },
  title: { textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1.5, overflow: 'hidden' },
  cardRow: { flexDirection: 'row' },
  inputRow: { flex: 1, minWidth: 0, minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: space.sm },
  input: {
    ...type.body,
    flex: 1,
    minWidth: 0, // let inputs shrink to their cell (web inputs have an intrinsic width)
    alignSelf: 'stretch',
    color: colors.text,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  dividerH: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginLeft: space.lg },
  dividerV: { width: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginVertical: space.md },
  footer: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xs, paddingHorizontal: space.xs, paddingTop: space.sm },
});
