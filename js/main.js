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
    inputs: [null, null, null, null, null],
    isFirstColumnBlocked: false,
    columns: [
      { title: 'Список №1', cards: [] },
      { title: 'Список №2', cards: [] },
      { title: 'Список №3', cards: [] }
    ]
  },
  // Вычисляемые свойства Vue-экземпляра
  computed: {
    // Вычисляемое свойство для проверки, нужно ли поле required
    isInputRequired() {
      // Подсчитываем количество заполненных полей
      const nonEmptyInputs = this.inputs.filter(input => input !== null && input !== '');
      // Возвращаем true для required, если заполнено меньше 3 полей
      return nonEmptyInputs.length < 3;
    }
  },
  // Наблюдатель за изменениями в столбцах для автоматического сохранения данных
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
  // Методы Vue-экземпляра, включая методы из модуля storageModule
  methods: {
    ...storageModule,
    // Метод для удаления группы карточек по идентификатору
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
    // Метод для перемещения карточек между столбцами с учетом прогресса
    moveColumn(fromColumn, toColumn, progressThreshold, maxToColumnLength) {
      fromColumn.forEach(card => {
        const progress = (card.items.filter(item => item.checked).length / card.items.length) * 100;
        if (progress >= progressThreshold && toColumn.length < maxToColumnLength) {
          toColumn.push(card);
          fromColumn.splice(fromColumn.indexOf(card), 1);
        }
      });
    },
    // Метод для перемещения карточек из первого столбца во второй
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
    // Метод для перемещения карточек из второго столбца в третий
    MoveSecondColm() {
      this.moveColumn(this.secondColumn, this.thirdColumn, 100, Infinity);
      this.MoveFirstColm();
    },
    // Метод для проверки и выполнения перемещения карточек
    checkMoveCard() {
      this.MoveFirstColm();
      this.MoveSecondColm();
    },
    // Метод для добавления новой карточки с группой
    addCard() {
      const nonNullInputs = this.inputs.filter(input => input !== null);
      if (nonNullInputs.length >= 3 && nonNullInputs.length <= 5 && this.groupName && !this.isFirstColumnBlocked) {
        if (this.firstColumn.length < 3) {
          this.firstColumn.push({ id: Date.now(), groupName: this.groupName, items: nonNullInputs.map(text => ({ text, checked: false })) });
          this.groupName = null;
          this.inputs = [null, null, null, null, null];
        }
      }
      // Проверка и выполнение перемещения карточек
      this.checkMoveCard();
      // Сохранение данных после добавления карточки
      this.saveData({
        firstColumn: this.firstColumn,
        secondColumn: this.secondColumn,
        thirdColumn: this.thirdColumn
      });
    },
    // Метод для загрузки данных из локального хранилища
    loadData() {
      const data = this.getData();
      this.firstColumn = data.firstColumn;
      this.secondColumn = data.secondColumn;
      this.thirdColumn = data.thirdColumn;
    },
  },
  // Логика, выполняемая после монтажа Vue-экземпляра
  mounted() {
    this.loadData();
    this.checkMoveCard();
  }
});
