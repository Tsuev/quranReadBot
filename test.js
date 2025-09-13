const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Конфигурация для тестирования из переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const PAGES_DIR = path.join(__dirname, "pages");

// Проверяем что все переменные окружения установлены
if (!BOT_TOKEN || !ADMIN_ID) {
  console.error(
    "❌ Ошибка: не найдены переменные окружения BOT_TOKEN или ADMIN_ID"
  );
  console.error(
    "Убедитесь что файл .env существует и содержит нужные переменные"
  );
  process.exit(1);
}

// Создание экземпляра бота
const bot = new TelegramBot(BOT_TOKEN);

// Счетчик текущей страницы
const COUNTER_FILE = path.join(__dirname, "page-counter.txt");
let currentPage = 1;

// Функция для загрузки текущей страницы из файла
function loadCurrentPage() {
  try {
    if (fs.existsSync(COUNTER_FILE)) {
      const page = parseInt(fs.readFileSync(COUNTER_FILE, "utf8"));
      currentPage = page || 1;
    }
  } catch (error) {
    console.error("Ошибка при загрузке счетчика страниц:", error);
    currentPage = 1;
  }
}

// Функция для сохранения текущей страницы в файл
function saveCurrentPage() {
  try {
    fs.writeFileSync(COUNTER_FILE, currentPage.toString());
  } catch (error) {
    console.error("Ошибка при сохранении счетчика страниц:", error);
  }
}

// Функция для получения следующей страницы
function getNextPage() {
  const pageToSend = currentPage;
  currentPage = currentPage >= 604 ? 1 : currentPage + 1;
  saveCurrentPage();
  return pageToSend;
}

// Простая функция тестовой отправки страницы
async function sendTestPage() {
  try {
    console.log("🧪 Тестовая отправка страницы...");

    const pageNumber = getNextPage();
    const paddedPageNumber = pageNumber.toString().padStart(3, "0");
    const imagePath = path.join(PAGES_DIR, `${paddedPageNumber}.png`);

    // Проверяем существование файла
    if (!fs.existsSync(imagePath)) {
      console.error(`❌ Файл не найден: ${imagePath}`);
      return;
    }

    // Формируем простую подпись
    const caption = `📖 Коран — Страница № ${pageNumber} (ТЕСТ)`;

    // Отправляем фото админу
    await bot.sendPhoto(ADMIN_ID, imagePath, { caption });

    console.log(`✅ Тестовая страница ${pageNumber} отправлена админу!`);
  } catch (error) {
    console.error("❌ Ошибка при тестовой отправке:", error);
  }
}

// Загружаем текущую страницу и запускаем тест
loadCurrentPage();
console.log("🧪 Запуск тестирования упрощенного бота");
console.log(`📖 Текущая страница: ${currentPage}`);

sendTestPage()
  .then(() => {
    console.log("✅ Тестирование завершено");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  });
