import { useLocalSearchParams } from 'expo-router';

import { StudyDetailScreen } from '@/screens/StudyDetailScreen';

/**
 * Ruta del detalle de un estudio.
 *
 * Fuera del grupo de pestanas: es una pantalla de profundidad, no un destino de
 * primer nivel, y llevar la barra de pestanas encima invitaria a saltar a otra
 * seccion en mitad de una lectura clinica.
 *
 * @returns La pantalla de detalle del estudio.
 */
export default function StudyRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <StudyDetailScreen studyId={id} />;
}
