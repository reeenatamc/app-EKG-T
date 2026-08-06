import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { SettingsSection } from '@/components/SettingsSection';
import { STUDY_TEXT } from '@/constants/studyText';
import { useStudyNote, useStudyNotes } from '@/ecg/notes';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

interface StudyNotesProps {
  readonly studyId: string;
}

/** Alto del campo. Da para varias lineas sin ocupar la pantalla entera. */
const NOTES_HEIGHT = 96;

/**
 * Anotacion del usuario sobre el estudio.
 *
 * SE GUARDA AL SALIR DEL CAMPO, no en cada tecla. Persistir en cada pulsacion
 * escribiria en disco decenas de veces por frase para ganar nada: lo que
 * importa es que no se pierda al cambiar de pantalla.
 *
 * La ayuda pide explicitamente que no se escriban datos identificativos. Es lo
 * unico que se puede hacer sin impedir escribir, y decirlo es mejor que
 * suponer que se sabe.
 *
 * @param studyId Identificador del estudio.
 * @returns El campo de anotaciones.
 */
export function StudyNotes({ studyId }: StudyNotesProps) {
  const theme = useTheme();
  const saved = useStudyNote(studyId);
  const setNote = useStudyNotes((state) => state.setNote);
  const [draft, setDraft] = useState(saved);

  return (
    <SettingsSection title={STUDY_TEXT.notesSection}>
      <View style={styles.field}>
        <TextInput
          multiline
          value={draft}
          onChangeText={setDraft}
          onBlur={() => setNote(studyId, draft)}
          placeholder={STUDY_TEXT.notesPlaceholder}
          placeholderTextColor={theme.textLow}
          accessibilityLabel={STUDY_TEXT.notesSection}
          style={[styles.input, { backgroundColor: theme.surface, color: theme.textHigh }]}
        />
        <Text style={[type.caption, { color: theme.textLow }]}>{STUDY_TEXT.notesHint}</Text>
      </View>
    </SettingsSection>
  );
}

const styles = StyleSheet.create({
  field: { gap: gap.xs },
  input: {
    ...type.body,
    minHeight: NOTES_HEIGHT,
    padding: gap.lg,
    borderRadius: radius.tile,
    textAlignVertical: 'top',
    minWidth: size.touchTarget,
  },
});
