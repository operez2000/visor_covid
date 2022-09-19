<template>
  <v-dialog v-model="dialog_process" persistent width="300">
    <v-card color="primary" dark>
      <v-card-text>
        <br />
        <h3>Un monmento por favor...</h3>
        <h4>{{ dialog_text }}</h4>
        <v-progress-linear
          indeterminate
          color="white"
          class="mb-0"
        ></v-progress-linear>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      dialog_process: false,
      dialog_text: '',
    }
  }
}
</script>