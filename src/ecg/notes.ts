import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Anotaciones del usuario sobre un estudio.
 *
 * SE QUEDAN EN EL DISPOSITIVO y no viajan al servidor. Es una nota para uno
 * mismo —"pendiente de comentar con cardiologia", "comparar con el del martes"—
 * y subirla la convertiria en parte de la historia clinica, con todo lo que eso
 * arrastra en custodia y consentimiento.
 *
 * Van a AsyncStorage y no al almacen seguro por el mismo criterio de
 * `state/settings.ts`: no son credenciales. La ayuda del campo pide
 * explicitamente que no se escriban datos que identifiquen al paciente, que es
 * lo unico que se puede hacer al respecto sin impedir escribir.
 */

interface NotesState {
  readonly byStudy: Readonly<Record<string, string>>;
  readonly setNote: (studyId: string, note: string) => void;
}

export const useStudyNotes = create<NotesState>()(
  persist(
    (set) => ({
      byStudy: {},
      setNote: (studyId, note) => {
        set((state) => ({ byStudy: { ...state.byStudy, [studyId]: note } }));
      },
    }),
    {
      name: 'ekg.studyNotes',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ byStudy: state.byStudy }),
    },
  ),
);

/**
 * Anotacion de un estudio.
 *
 * @param studyId Identificador del estudio.
 * @returns La anotacion, o cadena vacia si no hay ninguna.
 */
export function useStudyNote(studyId: string): string {
  return useStudyNotes((state) => state.byStudy[studyId] ?? '');
}
