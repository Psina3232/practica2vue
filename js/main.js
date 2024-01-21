Vue.component('card', {
    props: ['cardData', 'disableEdit'],
    methods: {
      updateProgress() {
        const checkedCount = this.cardData.items.filter(item => item.checked).length;
        const progress = (checkedCount / this.cardData.items.length) * 100;
        this.cardData.isComplete = progress === 100;
        if (this.cardData.isComplete) {
          this.cardData.lastChecked = new Date().toLocaleString();
        }
        this.$emit('update-progress');
        this.$emit('save-data');
      },
      deleteGroup() {
        this.$emit('delete-group', this.cardData.id);
        this.$emit('save-data');
      }
    },
    template: `
      <div class="card">
        <h3>{{ cardData.groupName }}</h3>
        <ul>
          <li v-for="item in cardData.items" :key="item.text">
            <input type="checkbox" v-model="item.checked" @change="updateProgress" :disabled="cardData.isComplete || disableEdit">
            {{ item.text }}
          </li>
        </ul>
        <p v-if="cardData.isComplete">100% выполнено! Дата и время: {{ cardData.lastChecked }}</p>
        <button v-if="cardData.isComplete" @click="deleteGroup" :disabled="disableEdit">Удалить</button>
      </div>
    `
  });
  new Vue({
    el: '#app',
    data: {
      ...storageModule.getData(),
      groupName: null,
      inputs: [null, null, null, null, null], // Updated to have 5 elements
      isFirstColumnBlocked: false,
      columns: [
        { title: 'Список №1', cards: [] },
        { title: 'Список №2', cards: [] },
        { title: 'Список №3', cards: [] }
      ]
    },
    watch: {
      columns: {
        handler() {
          this.saveData({
            firstColumn: this.firstColumn,
            secondColumn: this.secondColumn,
            thirdColumn: this.thirdColumn
          });
        },
        deep: true
      }
    },