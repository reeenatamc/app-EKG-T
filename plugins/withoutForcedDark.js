const { withAndroidStyles } = require('expo/config-plugins');

/**
 * Desactiva el modo oscuro forzado de Android para esta aplicacion.
 *
 * POR QUE HACE FALTA, y por que no basta con `userInterfaceStyle: 'automatic'`.
 * La desviacion D-7 curo la mitad del problema: con el sistema en oscuro y la
 * aplicacion en claro, MIUI repintaba todas las vistas. Declarar
 * `userInterfaceStyle` hizo que dejara de hacerlo en ese caso.
 *
 * Queda la otra mitad, que el rediseno saco a la luz. Con el sistema en oscuro Y
 * la aplicacion en oscuro, MIUI sigue oscureciendo cualquier `View` cuyo fondo sea
 * claro. Antes no se notaba porque en tema oscuro no habia ni una: todas las
 * superficies eran ciruela. Ahora si las hay —el boton invertido del modulo hero,
 * la opcion activa del control segmentado—, y medido sobre el framebuffer el
 * relleno hueso #FCF8F4 llegaba a pantalla como #221F1D.
 *
 * Es el mismo sintoma asimetrico de D-7: el lienzo Skia y el texto conservan su
 * color y las `View` no, porque una es superficie de GPU y la otra la compone el
 * sistema.
 *
 * `android:forceDarkAllowed="false"` es el mecanismo documentado para renunciar a
 * esa conversion. Se aplica con un plugin y no editando `android/` a mano porque
 * ese directorio lo regenera `expo prebuild` y el cambio se perderia en el
 * siguiente `run:android`.
 *
 * @param {import('expo/config').ExpoConfig} config Configuracion de Expo.
 * @returns {import('expo/config').ExpoConfig} La configuracion con el estilo modificado.
 */
module.exports = function withoutForcedDark(config) {
  return withAndroidStyles(config, (modConfig) => {
    const styles = modConfig.modResults?.resources?.style ?? [];

    for (const style of styles) {
      if (style.$?.name !== 'AppTheme') {
        continue;
      }

      const items = (style.item ?? []).filter(
        (item) => item.$?.name !== 'android:forceDarkAllowed',
      );
      items.push({ $: { name: 'android:forceDarkAllowed' }, _: 'false' });
      style.item = items;
    }

    return modConfig;
  });
};
