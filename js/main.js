// Определение модуля для работы с локальным хранилищем
const storageModule = {
  // Ключ для сохранения данных в локальном хранилище
  storageKey: 'notes-app',
  // Метод для получения данных из локального хранилища
  getData() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : { firstColumn: [], secondColumn: [], thirdColumn: [] };
  },
  // Метод для сохранения данных в локальное хранилище
  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }
};

// Определение Vue-компонента 'card'
Vue.component('card', {
  // Входные параметры (props) компонента
  props: ['cardData', 'disableEdit'],
  // Методы компонента
  methods: {
    // Метод для обновления прогресса выполнения карточки
    updateProgress() {
      const checkedCount = this.cardData.items.filter(item => item.checked).length;
      const progress = (checkedCount / this.cardData.items.length) * 100;
      this.cardData.isComplete = progress === 100;
      if (this.cardData.isComplete) {
        this.cardData.lastChecked = new Date().toLocaleString();
      }
      // Вызов событий для обновления прогресса и сохранения данных
      this.$emit('update-progress');
      this.$emit('save-data');
    },
    // Метод для удаления группы карточек
    deleteGroup() {
      this.$emit('delete-group', this.cardData.id);
      this.$emit('save-data');
    }
  }, computed: {
    cardColor() {
      const itemCount = this.cardData.items.length;
      if (itemCount <= 3) {
        return 'red'; // красный цвет для 3 и меньше пунктов
      } else if (itemCount === 4) {
        return 'blue'; // синий цвет для 4 пунктов
      } else if (itemCount >= 5) {
        return 'green'; // зеленый цвет для 5 и больше пунктов
      }
    }},
  // HTML-шаблон компонента
  template: `
  <div class="card" :class="cardColor">
  <h3>{{ cardData.groupName }}</h3>
  <ul>
    <li v-for="item in cardData.items" :key="item.text">
      <input type="checkbox" v-model="item.checked" @change="updateProgress" :disabled="cardData.isComplete || disableEdit">
      {{ item.text }}
    </li>
  </ul>
  <p v-if="cardData.isComplete">100% выполнено! Дата и время: {{ cardData.lastChecked }}</p>
  <button class="btn" v-if="cardData.isComplete" @click="deleteGroup" :disabled="disableEdit">Удалить</button>
</div>
  `
});

// Создание корневого экземпляра Vue
new Vue({
  // Привязка Vue-экземпляра к элементу с id "app"
  el: '#app',
  // Исходные данные Vue-экземпляра и инициализация столбцов
  data: {
    ...storageModule.getData(),
    groupName: null,
    inputs: [null, null, null],
    showAdditionalInputs: false,
    isFirstColumnBlocked: false,
    columns: [
      { title: 'Список №1', cards: [] },
      { title: 'Список №2', cards: [] },
      { title: 'Список №3', cards: [] }
    ]
  },

  computed: {

    isInputRequired() {
      const nonEmptyInputs = this.inputs.filter(input => input !== null && input !== '');
      return nonEmptyInputs.length < 3;
    },

    remainingInputsMessage() {
      const nonEmptyInputs = this.inputs.filter(input => input !== null && input !== '');
      const remaining = 3 - nonEmptyInputs.length;

      if (remaining > 0) {
        return `Заполните ещё минимум ${remaining} ${this.pluralize(remaining, ['пункт', 'пункта', 'пунктов'])}`;
      } else {
        return null;
      }
    }
  },
  methods: {
    ...storageModule,

    pluralize(number, forms) {
      if (number % 10 === 1 && number % 100 !== 11) {
        return forms[0];
      } else if (number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 10 || number % 100 >= 20)) {
        return forms[1];
      } else {
        return forms[2];
      }
    },

    addExtraInput() {
      if (this.inputs.length < 5) {
        this.inputs.push(null);
      }
    },

    removeExtraInput() {
      if (this.inputs.length > 3) {
        this.inputs.pop();
      }
    },

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
      const nonNullInputs = this.inputs.filter(input => input !== null);
      if (nonNullInputs.length >= 3 && nonNullInputs.length <= 5 && this.groupName && !this.isFirstColumnBlocked) {
        if (this.firstColumn.length < 3) {
          this.firstColumn.push({ id: Date.now(), groupName: this.groupName, items: nonNullInputs.map(text => ({ text, checked: false })) });
          this.groupName = null;
          this.inputs = [null, null, null, null, null];
        }
      }
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
