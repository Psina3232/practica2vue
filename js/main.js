const storageModule = {
    storageKey: 'notes-app',
    getData() {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : { firstColumn: [], secondColumn: [], thirdColumn: [] };
    },
    saveData(data) {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
  };
  
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
    methods: {
      ...storageModule,

        deleteGroup(groupId) {
          const indexFirst = this.firstColumn.findIndex(group => group.id === groupId);
          const indexSecond = this.secondColumn.findIndex(group => group.id === groupId);
          const indexThird = this.thirdColumn.findIndex(group => group.id === groupId);
  
          if (indexFirst !== -1) {
            this.firstColumn.splice(indexFirst, 1);
          } else if (indexSecond !== -1) {
            this.secondColumn.splice(indexSecond, 1);
          } else if (indexThird !== -1) {
            this.thirdColumn.splice(indexThird, 1);
          }

        },
      moveColumn(fromColumn, toColumn, progressThreshold, maxToColumnLength) {
        fromColumn.forEach(card => {
          const progress = (card.items.filter(item => item.checked).length / card.items.length) * 100;
          if (progress >= progressThreshold && toColumn.length < maxToColumnLength) {
            toColumn.push(card);
            fromColumn.splice(fromColumn.indexOf(card), 1);
          }
        });
      },
      MoveFirstColm() {
        if (this.secondColumn.length === 5 && this.firstColumn.some(card => {
          const progress = (card.items.filter(item => item.checked).length / card.items.length) * 100;
          return progress > 50;
        })) {
          this.isFirstColumnBlocked = true;
        } else {
          this.isFirstColumnBlocked = false;
          this.moveColumn(this.firstColumn, this.secondColumn, 50, 5);
        }
      },
      MoveSecondColm() {
        this.moveColumn(this.secondColumn, this.thirdColumn, 100, Infinity);
        this.MoveFirstColm();
      },
      checkMoveCard() {
        this.MoveFirstColm();
        this.MoveSecondColm();
      },
      addCard() {
        if (this.firstColumn.length < 3 && !this.isFirstColumnBlocked) {
          this.firstColumn.push({ id: Date.now(), groupName: this.groupName, items: this.inputs.map(text => ({ text, checked: false })) });
        }
        this.groupName = null;
        this.inputs = [null, null, null, null, null];
        this.checkMoveCard();
        this.saveData({
          firstColumn: this.firstColumn,
          secondColumn: this.secondColumn,
          thirdColumn: this.thirdColumn
        });
      },
      loadData() {
        const data = this.getData();
        this.firstColumn = data.firstColumn;
        this.secondColumn = data.secondColumn;
        this.thirdColumn = data.thirdColumn;
      },
    },
    mounted() {
      this.loadData();
      this.checkMoveCard();
    }
  });