import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MountId } from '@/camera/mounts';
import { useQualityReport } from '@/camera/useQualityReport';
import type { PreparedImage } from '@/capture/prepareStudy';
import { normalizeAnonymousId, STANDARD_CALIBRATION, type Calibration } from '@/capture/study';
import { ActionButton } from '@/components/ActionButton';
import { CalibrationFields } from '@/components/CalibrationFields';
import { FormField } from '@/components/FormField';
import { KeyboardLift } from '@/components/KeyboardLift';
import { MountPicker } from '@/components/MountPicker';
import { QualityReport } from '@/components/QualityReport';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SettingsSection } from '@/components/SettingsSection';
import { CONFIRM_TEXT } from '@/constants/captureText';
import { useTheme } from '@/design/theme';
import { gap, radius } from '@/design/tokens';
import { type } from '@/design/type';

/** Lo que el usuario decide antes de enviar. */
export interface StudyDraft {
  readonly mount: MountId;
  readonly calibration: Calibration;
  readonly anonymousId: string;
}

interface ConfirmScreenProps {
  readonly image: PreparedImage;
  readonly mount: MountId;
  readonly suggestedId: string;
  readonly onBack: () => void;
  readonly onSubmit: (draft: StudyDraft) => void;
}

/** Altura de la miniatura de comprobacion. */
const THUMBNAIL_HEIGHT = 160;

/**
 * Ultima pantalla antes de enviar: calidad, montaje, calibracion e identificacion.
 *
 * EL CONTROL DE CALIDAD ADVIERTE Y NO BLOQUEA. El boton de enviar esta activo
 * haya los hallazgos que haya. Quien captura puede estar en una guardia, con la
 * luz que hay, delante de una hoja que no va a volver a tener; una aplicacion
 * que se niega a aceptar esa foto no protege a nadie, solo se aparta.
 *
 * RESPETA EL AREA SEGURA SUPERIOR. Se abre como modal a pantalla completa, sin
 * cabecera del router, asi que nadie le reserva ese hueco: sin el margen, el
 * titular quedaba pisando el reloj de la barra de estado. Se vio en una captura
 * del pase de verificacion del rediseno.
 *
 * @param image Imagen ya recortada, tal y como se enviara.
 * @param mount Montaje elegido en la camara.
 * @param suggestedId Identificador anonimo generado.
 * @param onBack Vuelve al ajuste de esquinas.
 * @param onSubmit Acepta el estudio con sus metadatos.
 * @returns La pantalla de confirmacion.
 */
export function ConfirmScreen({ image, mount, suggestedId, onBack, onSubmit }: ConfirmScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { findings, isAnalyzing } = useQualityReport(image.uri, image.width);
  const [draft, setDraft] = useState<StudyDraft>(() => initialDraft(mount, suggestedId));

  return (
    <KeyboardLift>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + gap.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title={CONFIRM_TEXT.title} />

        <Image
          source={{ uri: image.uri }}
          style={[styles.thumbnail, { backgroundColor: theme.surface }]}
          resizeMode="contain"
        />

        <SettingsSection title={CONFIRM_TEXT.qualitySection}>
          <QualityReport findings={findings} isAnalyzing={isAnalyzing} />
        </SettingsSection>

        <StudyMetadataFields draft={draft} onChange={setDraft} />

        <ConfirmActions
          canSubmit={draft.anonymousId.length > 0 && !isAnalyzing}
          onBack={onBack}
          onSubmit={() => onSubmit(draft)}
        />
      </ScrollView>
    </KeyboardLift>
  );
}

interface ConfirmActionsProps {
  readonly canSubmit: boolean;
  readonly onBack: () => void;
  readonly onSubmit: () => void;
}

/**
 * Las dos salidas de la confirmacion.
 *
 * ENVIAR SE BLOQUEA POR DOS COSAS Y NINGUNA ES LA CALIDAD DE LA FOTO. Sin
 * identificador no habria con que referirse al estudio, y con el analisis de
 * calidad todavia en marcha el aviso llegaria despues del envio, o sea tarde.
 * Los hallazgos de calidad, en cambio, advierten y no bloquean: quien captura
 * puede estar en una guardia, delante de una hoja que no va a volver a tener.
 *
 * @param canSubmit Cierto si el estudio se puede enviar ya.
 * @param onBack Vuelve al ajuste de esquinas.
 * @param onSubmit Acepta el estudio.
 * @returns Las acciones del pie.
 */
function ConfirmActions({ canSubmit, onBack, onSubmit }: ConfirmActionsProps) {
  return (
    <View style={styles.actions}>
      <ActionButton label={CONFIRM_TEXT.back} onPress={onBack} variant="secondary" />
      <ActionButton
        label={CONFIRM_TEXT.submit}
        variant="primary"
        disabled={!canSubmit}
        onPress={onSubmit}
      />
    </View>
  );
}

function initialDraft(mount: MountId, anonymousId: string): StudyDraft {
  return { mount, calibration: STANDARD_CALIBRATION, anonymousId };
}

interface StudyMetadataFieldsProps {
  readonly draft: StudyDraft;
  readonly onChange: (draft: StudyDraft) => void;
}

/**
 * Los tres datos que acompanan a la imagen.
 *
 * NO HAY CAMPO DE NOMBRE, y no es un olvido. El identificador se genera solo y
 * puede sustituirse por el codigo del registro propio de quien captura. La
 * ayuda del campo lo dice con todas las letras, porque una restriccion que no
 * se explica se interpreta como una carencia.
 */
function StudyMetadataFields({ draft, onChange }: StudyMetadataFieldsProps) {
  const theme = useTheme();

  return (
    <>
      <SettingsSection title={CONFIRM_TEXT.mountSection}>
        <Text style={[type.caption, { color: theme.textLow }]}>{CONFIRM_TEXT.mountHint}</Text>
        <MountPicker value={draft.mount} onChange={(mount) => onChange({ ...draft, mount })} />
      </SettingsSection>

      <SettingsSection title={CONFIRM_TEXT.calibrationSection}>
        <Text style={[type.caption, { color: theme.textLow }]}>{CONFIRM_TEXT.calibrationHint}</Text>
        <CalibrationFields
          value={draft.calibration}
          onChange={(calibration) => onChange({ ...draft, calibration })}
        />
      </SettingsSection>

      <SettingsSection title={CONFIRM_TEXT.identitySection}>
        <FormField
          kind="text"
          label={CONFIRM_TEXT.identityLabel}
          hint={CONFIRM_TEXT.identityHint}
          value={draft.anonymousId}
          onChangeText={(raw) => onChange({ ...draft, anonymousId: normalizeAnonymousId(raw) })}
        />
      </SettingsSection>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: gap.lg, gap: gap.xl },
  thumbnail: { height: THUMBNAIL_HEIGHT, borderRadius: radius.tile },
  actions: { flexDirection: 'row', gap: gap.md },
});
