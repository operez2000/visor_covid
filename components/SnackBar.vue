<template>
  <!-- Snack bar para mensajes -->
  <v-snackbar v-model="snackbar" :timeout="7500" :bottom="true" :color="color">
    {{ text }}
    <v-btn icon text @click="snackbar = false">
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </v-snackbar>
</template>

<script>
export default {
  data() {
    return {
      snackbar: false,
      text: "",
      color: 'info',
    }
  }
}
</script>