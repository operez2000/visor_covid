<template>
  <v-layout
    column
    justify-center
    align-center
  >

    <v-card class="mt-10" v-if="userId == ''">
      <v-card-text>
        <h2>Para utilizar la aplicación es necesario ingresar desde la Intranet</h2>
      </v-card-text>
    </v-card>

    <v-flex xs12 sm8 md6 v-else>
      <div class="d-flex justify-end mb-1 mt-3">
        <!--<vuetify-logo />-->
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-btn fab color="info" small @click="dialogFechas = true" v-on="on">
              <v-icon>mdi-file-excel-outline</v-icon>
            </v-btn>
          </template>
          <span>Exportar a Excel</span>
        </v-tooltip>
        &nbsp;&nbsp;
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-btn fab color="blue" small @click="getOrders()" v-on="on">
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </template>
          <span>Actualizar Ordenes</span>
        </v-tooltip>
      </div>

      <v-row dense>
        <v-col class="mr-8" md="1" sm="2" xs="6">
          <v-select
            :items="filtroFechas"
            v-model="filtro"
            label="Por fecha de"
            @change="getOrders()"
            dense
          ></v-select>
        </v-col>
        <v-col md="2" sm="4" xs="6" class="mr-8">
          <v-dialog
            ref="dialogDesde"
            v-model="desde_modal"
            :return-value.sync="desde"
            width="290px"
          >
            <template v-slot:activator="{ on }">
              <v-text-field
                v-model="desde"
                label="Desde"
                append-icon="mdi-calendar"
                @click:append="desde_modal=true"
                readonly
                v-on="on"
                dense
              ></v-text-field>
            </template>
            <v-date-picker v-model="desde" scrollable light @input="desdeXL= desde; desde_modal = false; $refs.dialogDesde.save(desde);getOrders()" locale="es-mx">
            </v-date-picker>
          </v-dialog>
        </v-col>

        <v-col md="2" sm="4" xs="6">
          <v-dialog
            ref="dialogHasta"
            v-model="hasta_modal"
            :return-value.sync="hasta"
            width="290px"
          >
            <template v-slot:activator="{ on }">
              <v-text-field
                v-model="hasta"
                label="Hasta"
                append-icon="mdi-calendar"
                @click:append="hasta_modal=true"
                readonly
                v-on="on"
                dense
              ></v-text-field>
            </template>
            <v-date-picker v-model="hasta" scrollable light @input="hastaXL = hasta; hasta_modal = false; $refs.dialogHasta.save(hasta);getOrders()" locale="es-mx">
            </v-date-picker>
          </v-dialog>
        </v-col>

      </v-row>

      <v-row dense>
        <v-col cols="1" v-show="selected.length > 0 && !showProgress">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn color="light-green darken-4" class="ma-0 mb-0" small fab v-on="on" @click="enviarOrdenes()">
                <v-icon>mdi-check</v-icon>
              </v-btn>
            </template>
            <span>Enviar seleccionados</span>
          </v-tooltip>
        </v-col>
        <v-col cols="1" v-show="showProgress">
          <v-progress-circular
            :rotate="-90"
            :size="50"
            :width="5"
            :value="progress"
            color="lime darken-2"
          >
            <span style="font-size: 0.85em;">{{ progress }}%</span>
          </v-progress-circular>
        </v-col>
        <v-col>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Filtro de búsqueda"
            hide-details
            dense
            autocomplete="off"
          ></v-text-field>
        </v-col>
      </v-row>

      <br />

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="items"
        fixed-header
        heigth="90vh"
        :single-select="false"
        item-key="orden"
        show-select
        class="elevation-6 grey--text apuntador"
        :items-per-page.sync="itemsPerPage"
        :page="page"
        :search="search"
        :loading="loading"
        :loading-text="'Buscando información...'"
        :no-data-text="'No se encontraron registros'"
        :footer-props="$store.state.footer_props"
        @click:row="clickRow"
        dense
      >
        <!--
        <template v-slot:item.importe_pagado="props">
          <div style="text-align: right;">
            {{ Number(props.item.importe_pagado).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}) }}
          </div>
        </template>
        -->
        <template v-slot:top>
          <h3 class="mb-0 white--text pa-3 text-center">Total Ordenes: {{ new Intl.NumberFormat().format(items.length) }} | Seleccionadas: {{ new Intl.NumberFormat().format(selected.length) }}</h3>
        </template>
        <!--
        <template v-slot:expanded-item="{ headers, item }">
          <td :colspan="headers.length">
          </td>
        </template>
        -->
        <template v-slot:item.enviado="props">
            <!--<v-badge class="grey--text" left inline :color="props.item.clase" :content="props.item.enviado"></v-badge>-->
            <!--<v-chip :color="props.item.clase">{{ props.item.enviado }}</v-chip>-->
            <v-chip class="mt-1 mb-1" style="font-size: 0.85em;" small :color="(props.item.enviado == 'Pend') ? 'yellow darken-4' : ((props.item.enviado == 'No') ? 'red darken-1' : 'green darken-1') ">{{ props.item.enviado }}</v-chip>
        </template>
      </v-data-table>
    </v-flex>

    <v-dialog v-model="dialogDetalle" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card>
        <v-toolbar color="primary" dark dense>
          <v-toolbar-items>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-btn icon dark @click="dialogDetalle = false" v-on="on">
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
              </template>
              <span>Regresar</span>
            </v-tooltip>
          </v-toolbar-items>
          <v-spacer></v-spacer>
          <v-toolbar-title>Detalle de la Orden # {{ detalle.orden }}</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-card-text>
        <br>
        <v-layout row>
          <v-flex>
            <v-card>
              <!-- <v-card-title primary-title></v-card-title> -->
              <!-- <v-card-actions></v-card-actions> -->
              <v-row dense>
                <v-col md="2">
                  <v-text-field
                    v-model="detalle.orden"
                    label="No. de Orden"
                    dense
                    readonly
                  ></v-text-field>
                </v-col>
                <v-col md="1">
                  <v-text-field
                    v-model="detalle.enviado"
                    :background-color="detalle.clase"
                    label="Enviado"
                    dense
                    readonly
                  ></v-text-field>
                </v-col>
                <v-col md="1">
                  <v-tooltip right>
                    <template v-slot:activator="{ on }">
                      <v-text-field
                        v-model="detalle.respuesta"
                        label="Respuesta"
                        dense
                        v-on="on"
                        readonly
                      ></v-text-field>
                    </template>
                    <span v-if="detalle.respuestaCompleta.length > 0">{{ detalle.respuestaCompleta }}</span>
                  </v-tooltip>
                </v-col>
                <v-col md="2">
                  <v-text-field
                    v-model="detalle.fechaEnvio"
                    label="Fecha de Envio"
                    dense
                    readonly
                  ></v-text-field>
                </v-col>
                <v-col md="2">
                  <v-text-field
                    v-model="detalle.fechaOrden"
                    label="Fecha de la Orden"
                    dense
                    readonly
                  ></v-text-field>
                </v-col>
                <v-col md="2">
                  <v-text-field
                    v-model="detalle.fechaToma"
                    label="Fecha de la Toma"
                    dense
                    readonly
                  ></v-text-field>
                </v-col>
                <v-col md="2">
                  <v-text-field
                    v-model="detalle.fechaResultado"
                    label="Fecha del Resultado"
                    dense
                    readonly
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row dense>
                <v-col md="1">
                  <v-text-field
                    v-model="detalle.resultado"
                    label="Resultado"
                    dense
                    readonly
                  ></v-text-field>
                </v-col>
                <v-col md="3">
                  <v-text-field
                    v-model="detalle.paciente"
                    label="Nombre del Paciente"
                    dense
                    readonly
                  ></v-text-field>
                </v-col>
                <v-col md="1">
                  <v-text-field
                    v-model="detalle.edad"
                    label="Edad"
                    dense
                    readonly
                  ></v-text-field>
                </v-col>
                <v-col md="1">
                  <v-text-field
                    v-model="detalle.sexo"
                    label="Sexo"
                    dense
                    readonly
                  ></v-text-field>
                </v-col>
                <v-col md="1">
                  <v-text-field
                    v-model="detalle.telefono"
                    label="Teléfono"
                    dense
                    readonly
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row dense>
                <v-col md="3">
                  <v-text-field
                    v-model="detalle.quimico"
                    label="Químico responsable"
                    dense
                    readonly
                  ></v-text-field>
                </v-col>
                <v-col md="2">
                  <v-text-field
                    v-model="detalle.SintomasRespiratorios"
                    label="Síntomas (Diag. Presuntivo)"
                    dense
                    readonly
                  ></v-text-field>
                </v-col>
                <v-col md="2">
                  <v-text-field
                    v-model="detalle.MotivoPrueba"
                    label="Motivo (Observaciones)"
                    dense
                    readonly
                  ></v-text-field>
                </v-col>
                <v-col md="2">
                  <v-text-field
                    v-model="detalle.PruebaIndicacionMedica"
                    label="Ind Médica (Datos Clínicos)"
                    dense
                    readonly
                  ></v-text-field>
                </v-col>
                <v-col>
                  <v-text-field
                    v-model="detalle.userName"
                    label="Enviado por"
                    dense
                    readonly
                  ></v-text-field>
                </v-col>
              </v-row>

            </v-card>
          </v-flex>
        </v-layout>

        <v-layout class="mt-2" row wrap>

          <v-flex lg2 md3 sm6 xs6>
            <div class="lista overflow-y-auto barra">

              <v-card class="mx-auto" tile>
                <v-list shaped>
                  <v-subheader>Histórico</v-subheader>
                  <v-list-item-group v-model="detalle.item" color="blue lighten-3">
                    <v-list-item
                      v-for="(item, i) in detalle.historico"
                      :key="i"
                      prepend-icon="mdi-information-outline"
                      @click="clickHistorico(item)"
                    >
<!--
                      <v-list-item-icon>
                        <v-icon v-text="'mdi-information'"></v-icon>
                      </v-list-item-icon>
-->
                      <v-list-item-content>
                        <v-list-item-title v-text="item.fecha"></v-list-item-title>
                        <v-list-item-subtitle>Respuesta: {{ item.respuesta }}</v-list-item-subtitle>
                        <v-list-item-subtitle v-html="item.userName"></v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list-item-group>
                </v-list>
              </v-card>
            </div>
          </v-flex>

          <v-flex>
            <div class="ml-6">
              <h4>Detalle del envío</h4>
              <v-row dense>
                <v-col>
                  <pre>{{ detalle.detalleHistorico.envioParse }}</pre>
                </v-col>
              </v-row>
              <p />
              <v-row dense>
                <v-col>
                  <v-textarea label="Respuesta del envío" :value="detalle.detalleHistorico.respuestaCompleta" outlined dense></v-textarea>
                </v-col>
              </v-row>
            </div>
          </v-flex>

        </v-layout>
        </v-card-text>
      </v-card>

    </v-dialog>

    <!-- diálogo para seleccionar fechas para exportar a Excel -->
    <v-dialog v-model="dialogFechas" max-width="400px" transition="dialog-transition">
      <v-card light>
        <v-card-title>
          <span class="headline">Exportar a Excel <span style="font-size: 0.85em;font-weight: bold;">- (Fecha de {{ filtro }})</span> </span>
        </v-card-title>
        <v-card-text>
          <v-row dense v-show="!reporteResumido">
            <v-col>
              <v-dialog ref="refDesdeXL" v-model="desdeModalXL" :return-value.sync="desdeXL" width="290px">
                <template v-slot:activator="{ on }">
                  <v-text-field v-model="desdeXL" label="Desde" prepend-icon="mdi-calendar" readonly v-on="on" dense></v-text-field>
                </template>
                <v-date-picker v-model="desdeXL" scrollable light @input="desdeModalXL = false;$refs.refDesdeXL.save(desdeXL);" locale="es-mx">
                </v-date-picker>
              </v-dialog>
            </v-col>
            <v-col>
              <v-dialog ref="refHastaXL" v-model="hastaModalXL" :return-value.sync="hastaXL" width="290px">
                <template v-slot:activator="{ on }">
                  <v-text-field v-model="hastaXL" label="Hasta" prepend-icon="mdi-calendar" readonly v-on="on" dense></v-text-field>
                </template>
                <v-date-picker v-model="hastaXL" scrollable light @input="hastaModalXL = false;$refs.refHastaXL.save(hastaXL);" locale="es-mx">
                </v-date-picker>
              </v-dialog>
            </v-col>
          </v-row>
          <!-- Opcion para determinar si es el reporte general o resumido (Andrea Ruiz -->
          <v-row dense>
            <v-col>
              <v-checkbox label="Reporte resumido (detectados)" v-model="reporteResumido"></v-checkbox>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="orange darken-1" text @click="dialogFechas = false">Cerrar</v-btn>
          <v-btn color="green darken-1" text @click="dialogFechas = false;exportarExcel();" :disabled="desdeXL > hastaXL">Exportar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Componentes -->
    <proceso ref="proceso" />
    <SnackBar ref="snackbar" />

  </v-layout>
</template>

<script>
import XLSX from 'xlsx'

export default {

  data() {
    return {
      userId: "",
      userName: "",
      selected: [],
      singleSelect: false,
      page: 1,
      itemsPerPage: 10,
      loading: true,
      max20charsOrdenSil: v => v.length <= 20 || 'El # de Orden es demasiado grande',
      search: '',
      headers: [
        { text: '', value: 'data-table-expand' },
        { text: 'Enviado', value: 'enviado', align: 'center' },
        { text: 'Fecha de Envío', value: 'fechaEnvio' },
        { text: 'Respuesta', value: 'respuesta' },
        { text: 'Orden', value: 'orden', width: "140px" },
        //{ text: 'Nombre del Paciente', value: 'paciente' },
        { text: 'Edad', value: 'edad' },
        { text: 'Sexo', value: 'sexo' },
        //{ text: 'telefono', value: 'telefono' },
        //{ text: 'Fecha Orden', value: 'fechaOrden' },
        //{ text: 'Fecha Resultado', value: 'fechaResultado' },
        //{ text: 'Fecha Toma', value: 'fechaToma' },
        { text: 'Resultado', value: 'resultado' },
        //{ text: 'Químico Responsable', value: 'quimico' },
        { text: 'Síntomas Resp.', value: 'SintomasRespiratorios' },
        { text: 'Motivo', value: 'MotivoPrueba'},
        { text: 'Prueba Ind Med.', value: 'PruebaIndicacionMedica' },
      ],
      items: [],
      table_caption: 'Confirmacion de citas y pagos para toma de Muestra COVID-19',
      detalle: {
        item: 0,
        id_toma: 0,
        orden: '',
        enviado: '',
        clase: '',
        respuesta: '',
        respuestaCompleta: '',
        fechaEnvio: '',
        paciente: '',
        edad: '',
        sexo: '',
        telefono: '',
        fechaOrden: '',
        fechaResultado: '',
        fechaToma: '',
        resultado: '',
        quimico: '',
        SintomasRespiratorios: '',
        PruebaIndicacionMedica: '',
        MotivoPrueba: '',
        userId: '',
        userName: '',
        historico: [],
        detalleHistorico: {
          envio: '',
          envioParse: '',
          respuestaCompleta: ''
        },
      },
      desde: new Date().toLocaleString('es-MX',
        {timeZone: 'America/Tijuana', year: 'numeric', month: '2-digit', day: '2-digit'}
      ),
      hasta: '',
      desde_modal: false,
      hasta_modal: false,
      desdeXL: '',
      hastaXL: '',
      desdeModalXL: false,
      hastaModalXL: false,
      dialog: false,
      importacion: true,
      texto_proceso: "",
      rules: {
        required: v => !!v || "Valir requerido",
        onlyNumbers: v => {
          const pattern = /^([0-9]+(\.[0-9]+)?)*$/g
          return pattern.test(v) || 'Sólo Números'
        },
      },
      dialogFechas: false,
      dialogDetalle: false,
      progress: 0,
      showProgress: false,
      socket: null,
      filtroFechas: [
        "Orden",
        "Envio"
      ],
      filtro: '',
      reporteResumido: false,
    }
  }, // data()

  beforeDestroy() {
    this.socket = null
  },

  mounted() {

    const url = window.location.href

    console.log('url', url)

    const ws = {
      server: '10.200.0.50',
      port: '8013'
    }
    if (url.indexOf('127.0.0.1') >= 1 || url.indexOf('localhost') >= 1)  {  // Se está ejecutando fuera del server, cambio la ruta de Web Sockets
      ws.server = '127.0.0.1'
    }

    console.log('Servidor ws ' + ws.server + ':' + ws.port)

    if (this.$route.query.userId) {
      this.userId = this.$route.query.userId
      this.getUser()
    }
    this.desde = this.desde.substr(6, 4) + "-" + this.desde.substr(3, 2) + "-" + this.desde.substr(0, 2)
    this.hasta = this.desdeXL = this.hastaXL = this.desde
    this.filtro = this.filtroFechas[0]
    this.getOrders()   //this.orders()  // prueba async/await
    this.$refs.proceso.dialog_text = ''
    this.$refs.proceso.dialog_process = false
    if (localStorage.itemsPerPage) this.itemsPerPage = Number(localStorage.itemsPerPage)

    // WebSockets ------------------------------------------------------------
    this.socket = new WebSocket('ws://' + ws.server + ':' + ws.port)
    this.socket.onopen = () => {
      console.log('Comunicación establecida con servidor WebSockets 8013')
    }
    let json = null
    this.socket.onmessage = (msg) => {
      console.log('Mensaje recibido', msg.data)
      json = JSON.parse(msg.data)
      if (json.orden) {
        console.log('desde', this.desde, 'hasta', this.hasta, json.orden)
        this.nuevaOrden(json)
      } else if(json.codigo) {
        console.log('Codigo', json.codigo, json.msg)
      }
    } // WebSockets -----------------------------------------------------------

    //debugger
  },

  computed: {
  },

  watch: {
    itemsPerPage: function() {
      localStorage.itemsPerPage = this.itemsPerPage
      this.selected = []
    }
  },

  methods: {
    // Lectura de ordenes desde el SIL

    async getUser() {
      let resp = await this.$axios.get('/api/usuario/?userId=' + this.userId)
      try {
        this.userName = await resp.data.results.userName
      } catch (error) {
        console.log('Error al intentar leer el nombre del Usuario (rh)', error)
      }
    },

    async orders() {
      this.loading = true
      this.items = []
      let respuesta = await this.$axios.get('/api/ordenes/?desde=' + this.desde + '&hasta=' + this.hasta)
      const datos = await respuesta.data
    }, // async orders()

    getOrders() {

      if (this.desde > this.hasta) {
        this.$refs.snackbar.color = 'deep-orange darken-3'
        this.$refs.snackbar.text = 'Verifica que la Fecha Inicial sea menor o igual a la Fecha Final'
        this.$refs.snackbar.snackbar = true
        return
      }

      if (this.filtro == '') {
        this.filtro = this.filtroFechas[0]
      }

      this.loading = true
      this.$refs.proceso.dialog_text = 'Leyendo información'
      this.$refs.proceso.dialog_process = true
      this.selected = []
      this.showProgress = false
      this.progress = 0
      this.items = []
      this.$axios({
        method: 'get',
        url: '/api/ordenes/',
        params: {
          desde: this.desde,
          hasta: this.hasta,
          filtro: this.filtro
        },
        headers: {
          'Content-Type': 'multipart/form-data; application/json',
          'Accept' : 'application/json'
        }
      }).then( response => {
        if (response.data.items) {
          this.items = response.data.items
        } else {
          this.$refs.snackbar.color = "deep-orange darken-3"
          this.$refs.snackbar.text = "Se detectó un inconveniente con la Base de Datos, favor de avisar a TI"
          this.$refs.snackbar.snackbar = true
        }
      }).catch( response=> {
        console.log('Error:', response)
      }).finally( () => {
        this.loading = false
        this.table_caption = 'Registros para envío al INDRE - Ordenes: ' + this.items.length
        this.$refs.proceso.dialog_text = ''
        this.$refs.proceso.dialog_process = false
      })
    }, // getOrders()

    async enviarOrdenes () {
      let url='';
      this.showProgress = true
      this.progress = 0
      for (let index = 0; index < this.selected.length; index++) {
        this.progress = parseInt( ((index +1) / this.selected.length) * 100 )
        const element = this.selected[index]
        url = `/api/enviar/?id_toma=${element.id_toma}&orden=${element.orden}&userId=${this.userId}&userName=${this.userName}`
        const resp = await this.$axios.get(url)
        console.log('Respuesta del envío:', resp.data)
        if (resp.data.result == 500) {
          this.$refs.snackbar.color = "deep-orange darken-3"
          this.$refs.snackbar.text = "No se encontraron registros en la búsqueda... Verifica las fechas"
          this.$refs.snackbar.snackbar = true
        } else if (resp.data.result == 404) {
          let errMsg = (typeof resp.data.results == 'object') ? JSON.parse(resp.data.results) : resp.data.results
          this.$refs.snackbar.color = "deep-orange darken-3"
          this.$refs.snackbar.text = "Se detectó un inconveniente con la Base de Datos: " + errMsg
          this.$refs.snackbar.snackbar = true
        } else if (resp.data.result == 200 && resp.data.respuestaCompleta == "200") {
          // Todo Ok
          this.$refs.snackbar.snackbar = false
        } else {
          this.$refs.snackbar.color = "deep-orange darken-3"
          this.$refs.snackbar.text = "No se recibió respuesta del servidor de la Secretaría de Salud " + resp.data.respuestaCompleta
          this.$refs.snackbar.snackbar = true
        }
      }
      this.getOrders();
    }, // enviarOrdenes()

    clickRow(value) {

      let json = {}

      this.$refs.proceso.dialog_text = 'Leyendo orden ' + value.orden
      this.$refs.proceso.dialog_process = true
      this.dialogDetalle = true

      this.detalle.id_toma = value.id_toma
      this.detalle.orden = value.orden

      this.$axios({
        url: '/api/ordenes/',
        method: 'get',
        params: {
          id_toma: value.id_toma
        }
      }).then( resp => {
        let json = resp.data.items[0]

        this.detalle.enviado = json.enviado
        this.detalle.clase = json.clase
        this.detalle.respuesta = json.respuesta
        this.detalle.respuestaCompleta = json.respuestaCompleta
        this.detalle.fechaEnvio = json.fechaEnvio
        this.detalle.paciente = json.paciente
        this.detalle.edad = json.edad
        this.detalle.sexo = json.sexo
        this.detalle.telefono = json.telefono
        this.detalle.fechaOrden = json.fechaOrden
        this.detalle.fechaResultado = json.fechaResultado
        this.detalle.fechaToma = json.fechaToma
        this.detalle.resultado = json.resultado
        this.detalle.quimico = json.quimico
        this.detalle.SintomasRespiratorios = json.SintomasRespiratorios
        this.detalle.MotivoPrueba = json.MotivoPrueba
        this.detalle.PruebaIndicacionMedica = json.PruebaIndicacionMedica
        this.detalle.userId = json.userId
        this.detalle.userName = json.userName
        this.detalle.historico = resp.data.historico
        this.detalle.detalleHistorico.envio = (this.detalle.historico.length > 0) ? this.detalle.historico[0].envio : ''
        this.detalle.detalleHistorico.envioParse = this.detalle.detalleHistorico.envio.length > 0 ? JSON.parse(this.detalle.detalleHistorico.envio) : {}
        this.detalle.detalleHistorico.respuestaCompleta = (this.detalle.historico.length > 0) ? this.detalle.historico[0].respuestaCompleta : ''
      }).catch( err => {
        console.log('Error en clickRow', err)
        this.$refs.snackbar.color = 'deep-orange darken-3'; this.$refs.snackbar.text = 'Se detectó un problema con el servidor, favor de notificar a TI'; this.$refs.snackbar.snackbar = true

      }).finally( () => {
        this.$refs.proceso.dialog_process = false
      })

    }, // clickRow()

    clickHistorico(item) {
      this.detalle.detalleHistorico.envio = item.envio
      this.detalle.detalleHistorico.envioParse = this.detalle.detalleHistorico.envio.length > 0 ? JSON.parse(this.detalle.detalleHistorico.envio) : {}
      this.detalle.detalleHistorico.respuestaCompleta = item.respuestaCompleta
    },

    exportarExcel() {

      let json = {}

      this.$refs.proceso.dialog_text = ""
      this.$refs.proceso.dialog_process = true

      if (this.reporteResumido) {
        // Reporte resumido (Andrea Ruiz)
        this.$axios({
          method: 'get',
          url: '/api/ordenes_detectadas/',
          params: {}
        }).then( resp => {
          json = resp.data
          if (json.result == 200) {
            // make the worksheet
            let ws = XLSX.utils.json_to_sheet(json.items)
            // Definir ancho de columnas
            ws['!cols'] = [
              { wch: 35 },
              { wch: 25 },
              { wch: 10 },
              { wch: 13 },
              { wch: 13 }
            ]
            // add to workbook
            let wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Hoja1")
            // generate an XLSX file
            XLSX.writeFile(wb, "Reporte_Resultados_Detectados_COVID.xlsx")
            json.msg = ""
          } else {
            json.msg = "Se detectó un inconveniente con el Servidor"
          }
        }).catch( resp => {
          json.result = 404
          json.msg = resp
        }).finally( () => {
          this.$refs.proceso.dialog_text = ""
          this.$refs.proceso.dialog_process = false
          this.$refs.snackbar.text = json.msg
          this.$refs.snackbar.color = "deep-orange darken-3"
          this.$refs.snackbar.snackbar = (json.msg != "")
        })

      } else {
        // Reporte general
        this.$axios({
          method: 'get',
          url: '/api/ordenes/',
          params: {
            desde: this.desdeXL,
            hasta: this.hastaXL,
            filtro: this.filtro
          }
        }).then( resp => {
          json = resp.data
          if (json.result == 200) {
            // make the worksheet
            let ws = XLSX.utils.json_to_sheet(json.items)
            // add to workbook
            let wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Hoja1")
            // generate an XLSX file
            XLSX.writeFile(wb, this.desde + "_" + this.hasta + ".xlsx")
            json.msg = ""
          } else {
            json.msg = "Se detectó un inconveniente con el Servidor"
          }
        }).catch( resp => {
          json.result = 404
          json.msg = resp
        }).finally( () => {
          this.$refs.proceso.dialog_text = ""
          this.$refs.proceso.dialog_process = false
          this.$refs.snackbar.text = json.msg
          this.$refs.snackbar.color = "deep-orange darken-3"
          this.$refs.snackbar.snackbar = (json.msg != "")
        })

      }

    }, // exportarExcel()

    toggleSelectAll(value) {
      if (this.itemsPerPage == 100 || this.itemsPerPage == -1) {
//        this.$refs.snackbar.text = 'Seleccionando... un momento por favor'; this.$refs.snackbar.color = 'grey'; this.$refs.snackbar.snackbar = true
      }
    }, // toggleSelectAll()

    nuevaOrden(objeto) {
      let json = {}

      if (objeto && objeto.id_toma && objeto.id_toma > 0) { // Solamente proceso cuando la notificación corresponide a una orden con COVID19
        this.$refs.proceso.dialog_text = 'Procesaqndo orden nueva ' + (objeto.orden) ? objeto.orden : ''
        this.$refs.proceso.dialog_process = true
        this.$refs.snackbar.text = 'Actualización de Orden: ' + objeto.orden; this.$refs.snackbar.color = 'blue darken-3'; this.$refs.snackbar.snackbar = true
        this.$axios({
          url: '/api/ordenes/',
          method: 'get',
          params: {
            id_toma: objeto.id_toma
          }
        }).then( resp => {
          if (resp.data.result == 200) {
            if (resp.data.items.length > 0) {
              let json = resp.data.items[0]
              let fechaOrden = json.fechaOrden.substr(0, 10)  // yyyy-mm-dd
              if (fechaOrden >= this.desde && fechaOrden <= this.hasta) {
                let index = this.items.findIndex(i => i.id_toma == json.id_toma)
                if (index == -1) {  // solamente cuando no está en la lista, para evitar duplicidad
                  this.items.push(json)
                } else {            // actualizo el registro en caso de que haya cambios
                  this.items[index] = json
                }
              }
            }
          }
        }).catch( err => {
          console.log('Error en ordenNueva()', err)
        }).finally( () => {
          this.$refs.proceso.dialog_process = false
        })
      }

    }, // nuevaOrden()

  }, // methods

} // export default
</script>
<style>
#mytable .v-data-table__wrapper {
  height:calc(100vh - 110px) !important;
}
.apuntador tbody tr {
  cursor: pointer;
}
.lista {
  max-height:calc(100vh - 260px) !important;
  /*width: 320px;*/
 }

/* width */
.barra::-webkit-scrollbar {
  width: 4px;
}

/* Track */
.barra::-webkit-scrollbar-track {
  background: grey;
}

/* Handle */
.barra::-webkit-scrollbar-thumb {
  background: #455A64;
  border-radius: 7px;
}

/* Handle on hover */
.barra::-webkit-scrollbar-thumb:hover {
  background: #37474F;
}

</style>
