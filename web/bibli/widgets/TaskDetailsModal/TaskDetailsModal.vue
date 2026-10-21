<template>
  <BaseModal
    v-if="task"
    :model-value="true"
    @update:model-value="$emit('close')"
    :title="task.name"
    size="md"
    class="task-details-modal"
  >
      <div class="task-info">
        <p><strong>Описание:</strong> {{ task.description || '—' }}</p>
        <p><strong>Исполнитель:</strong> {{ getStaffName(task.executor_id) }}</p>
        <p v-if="task.co_executor"><strong>Соисполнитель:</strong> {{ getStaffName(task.co_executor_id) }}</p>
        <p v-if="task.manager"><strong>Менеджер:</strong> {{ getStaffName(task.manager_id) }}</p>
        <p v-if="task.observer"><strong>Наблюдатель:</strong> {{ getStaffName(task.observer_id) }}</p>
        <p><strong>Крайний срок:</strong> {{ formatDate(task.deadline) }}</p>
        <p><strong>Дата постановки:</strong> {{ formatDate(task.created_at) }}</p>
      </div>


      <div v-if="task.files && task.files.length > 0" class="task-files-block">
        <h3>Прикрепленные файлы</h3>
        <div class="task-files-list">
          <div v-for="file in task.files" :key="file.id" class="task-file-item">
            <div class="task-file-info">
              <i class="pi pi-file"></i>
              <span class="task-file-name">{{ file.original_name }}</span>
              <span class="task-file-size">({{ formatFileSize(file.file_size) }})</span>
            </div>
            <a :href="getFileUrl(file.document_id || file.id)" target="_blank" class="task-file-download"
              title="Скачать файл">
              <i class="pi pi-download"></i>
            </a>
          </div>
        </div>
      </div>

      <div class="task-comments-block">
        <h3>Комментарии</h3>
        <div v-if="loading" class="comments-loading">
          <span class="spinner"></span>
          <span class="spinner-text">Загрузка комментариев...</span>
        </div>
        <div v-else>
          <div v-if="comments.length">
            <div v-for="comment in comments" :key="comment.id" class="comment-item"
              :class="{ editing: editingCommentId === comment.id }">
              <div class="comment-header">
                <span class="comment-user">{{ getCommentUserName(comment) }}</span>
                <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
                <span class="comment-actions">
                  <button class="icon-btn edit" @click="startEditComment(comment)"><i class="pi pi-pencil"></i><span
                      class="btn-label">Редактировать</span></button>
                  <button class="icon-btn delete" @click="$emit('remove-comment', comment.id)"><i
                      class="pi pi-trash"></i><span class="btn-label">Удалить</span></button>
                </span>
              </div>
              <div v-if="editingCommentId === comment.id" class="edit-comment-block">
                <div class="edit-title">Редактирование комментария</div>
                <form @submit.prevent="submitEditComment(comment.id)" class="edit-comment-form">
                  <textarea v-model="editCommentText" required placeholder="Введите новый текст комментария..."
                    class="edit-textarea" rows="3"></textarea>
                  <div class="edit-files-list" v-if="comment.files && comment.files.length">
                    <div class="edit-files-title">Удалить файлы:</div>
                    <label v-for="file in comment.files" :key="file.id" class="edit-file-item">
                      <input type="checkbox" v-model="editDeleteFiles" :value="file.document_id" />
                      <img :src="getFileUrl(file.document_id)" class="edit-file-preview" />
                      <span class="edit-file-label">Удалить</span>
                    </label>
                  </div>
                  <div class="edit-upload-block">
                    <div class="edit-upload-title">Добавить файлы:</div>
                    <input type="file" multiple @change="onEditFilesChange($event)" class="edit-upload-input" />
                    <div class="edit-upload-hint">Перетащите файлы сюда или выберите вручную</div>
                  </div>
                  <div class="edit-actions">
                    <button type="submit" class="edit-save-btn"><i class="pi pi-save"></i> Сохранить</button>
                    <button type="button" class="edit-cancel-btn" @click="cancelEditComment"><i class="pi pi-times"></i>
                      Отмена</button>
                  </div>
                </form>
              </div>
              <div v-else class="comment-body">
                {{ comment.comment }}
                <div v-if="comment.files && comment.files.length" class="comment-files">
                  <template v-for="file in comment.files" :key="file.id">
                    <a :data-fancybox="'comment-' + comment.id" :href="getFileUrl(file.document_id)"
                      :data-caption="comment.comment">
                      <img :src="getFileUrl(file.document_id)" class="comment-img-preview" />
                    </a>
                  </template>
                </div>
              </div>
            </div>
          </div>
          <div v-else>Комментариев нет</div>
        </div>
        <form class="add-comment-form" @submit.prevent="submitNewComment">
          <input v-model="newCommentText" placeholder="Добавить комментарий..." required />
          <input type="file" multiple @change="onNewFilesChange" />
          <button type="submit" class="icon-btn add"><i class="pi pi-send"></i></button>
        </form>
      </div>
  </BaseModal>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { http } from '@/shared/api';
import { BaseModal } from '@/shared/ui';
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

onMounted(() => {
  Fancybox.bind("[data-fancybox]", {});
});

const props = defineProps({
  task: { type: Object, required: true },
  comments: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
});
const emit = defineEmits(['close', 'add-comment', 'edit-comment', 'remove-comment']);
const newCommentText = ref('');
const newCommentFiles = ref([]);
const editingCommentId = ref(null);
const editCommentText = ref('');
const editNewFiles = ref([]);
const editDeleteFiles = ref([]);
function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleString('ru-RU');
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
function getStaffName(staffId) {
  if (!staffId) return '—';

  if (props.task) {
    if (props.task.executor_id === staffId && props.task.executor) {
      return [props.task.executor.surname, props.task.executor.name, props.task.executor.patronymic].filter(Boolean).join(' ');
    }
    if (props.task.co_executor_id === staffId && props.task.co_executor) {
      return [props.task.co_executor.surname, props.task.co_executor.name, props.task.co_executor.patronymic].filter(Boolean).join(' ');
    }
    if (props.task.manager_id === staffId && props.task.manager) {
      return [props.task.manager.surname, props.task.manager.name, props.task.manager.patronymic].filter(Boolean).join(' ');
    }
    if (props.task.observer_id === staffId && props.task.observer) {
      return [props.task.observer.surname, props.task.observer.name, props.task.observer.patronymic].filter(Boolean).join(' ');
    }
  }

  return staffId || '—';
}

function getCommentUserName(comment) {
  if (!comment.user) return `Пользователь #${comment.user_id}`;

  const { surname, name, patronymic } = comment.user;
  const fio = [surname, name, patronymic].filter(Boolean).join(' ');
  return fio || `Пользователь #${comment.user_id}`;
}
function submitNewComment() {
  emit('add-comment', { text: newCommentText.value, files: newCommentFiles.value });
  newCommentText.value = '';
  newCommentFiles.value = [];
}
function onNewFilesChange(e) {
  newCommentFiles.value = Array.from(e.target.files);
}
function onEditFilesChange(e) {
  editNewFiles.value = Array.from(e.target.files);
}
function getFileUrl(documentId) {
  return http.defaults.baseURL + `/document/${documentId}`;
}
function startEditComment(comment) {
  editingCommentId.value = comment.id;
  editCommentText.value = comment.comment;
  editNewFiles.value = [];
  editDeleteFiles.value = [];
}
function cancelEditComment() {
  editingCommentId.value = null;
  editCommentText.value = '';
  editNewFiles.value = [];
  editDeleteFiles.value = [];
}
function submitEditComment(commentId) {
  emit('edit-comment', {
    id: commentId,
    text: editCommentText.value,
    new_files: editNewFiles.value,
    delete_files: editDeleteFiles.value || []
  });
  cancelEditComment();
}
</script>
<style scoped>

.task-info {
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1.5px solid var(--russ-border-light);
}

.task-info p {
  margin: 0 0 8px 0;
  font-size: 15.5px;
  color: var(--russ-text-primary);
  line-height: 1.6;
}

.task-info strong {
  color: var(--russ-text-tertiary);
}

.task-comments-block {
  margin-top: 18px;
}

.task-comments-block h3 {
  font-size: 18px;
  margin-bottom: 12px;
  color: var(--russ-accent);
  font-weight: 600;
}

.comment-item {
  border-bottom: 1px solid var(--russ-border-light);
  padding: 12px 0 14px 0;
  background: var(--russ-bg-secondary);
  border-radius: 8px;
  margin-bottom: 10px;
  position: relative;
  transition: box-shadow 0.15s;
}

.comment-item.editing {
  background: var(--russ-info-light);
  border: 2px solid var(--russ-accent);
  box-shadow: 0 2px 12px var(--russ-shadow-accent-light);
  z-index: 2;
}

.comment-header {
  font-size: 13.5px;
  color: #888;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.comment-user {
  font-weight: 500;
  color: var(--russ-accent);
}

.comment-date {
  color: var(--russ-text-quaternary);
}

.comment-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  margin: 0 2px;
  padding: 4px 7px;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
  color: var(--russ-accent);
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn.edit:hover {
  background: var(--russ-info-light);
  color: var(--russ-info-dark);
}

.icon-btn.delete:hover {
  background: var(--russ-error-light);
  color: var(--russ-error);
}

.icon-btn.add:hover {
  background: var(--russ-success-light);
}

.icon-btn.save:hover {
  background: var(--russ-success-light);
}

.icon-btn.cancel:hover {
  background: #fbe9e7;
}

.btn-label {
  font-size: 13px;
  margin-left: 4px;
  color: var(--russ-accent);
}

.comment-body {
  font-size: 15.5px;
  color: var(--russ-text-primary);
  word-break: break-word;
  margin-top: 4px;
}

.comment-files {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 7px;
}

.comment-img-preview {
  max-width: 110px;
  max-height: 110px;
  border-radius: 8px;
  box-shadow: 0 1px 6px var(--russ-shadow-color);
  object-fit: cover;
  margin-right: 4px;
  background: var(--russ-bg-disabled);
  border: 1.5px solid var(--russ-border);
  margin-bottom: 4px;
  display: block;
  cursor: pointer;
  transition: box-shadow 0.15s;
}

.comment-img-preview:hover {
  box-shadow: 0 2px 12px var(--russ-shadow-accent);
  border-color: var(--russ-info-border);
}

.edit-comment-block {
  margin-top: 8px;
  background: var(--russ-bg-blue-light);
  border-radius: 8px;
  padding: 12px 10px 10px 10px;
  box-shadow: 0 1px 6px var(--russ-shadow-accent-light);
}

.edit-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--russ-accent);
  margin-bottom: 8px;
}

.edit-comment-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-textarea {
  width: 100%;
  min-height: 60px;
  font-size: 15px;
  border-radius: 7px;
  border: 1.5px solid var(--russ-info-border);
  padding: 8px 12px;
  resize: vertical;
  background: #fff;
}

.edit-files-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  margin-bottom: 4px;
}

.edit-files-title {
  width: 100%;
  font-size: 14px;
  color: #888;
  margin-bottom: 2px;
}

.edit-file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f7fa;
  border-radius: 6px;
  padding: 4px 8px;
}

.edit-file-preview {
  width: 38px;
  height: 38px;
  object-fit: cover;
  border-radius: 5px;
  border: 1px solid var(--russ-border);
  background: var(--russ-bg-secondary);
}

.edit-file-label {
  font-size: 13px;
  color: var(--russ-error);
  margin-left: 2px;
}

.edit-upload-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.edit-upload-title {
  font-size: 14px;
  color: #888;
}

.edit-upload-input {
  margin-top: 2px;
}

.edit-upload-hint {
  font-size: 12px;
  color: #aaa;
  margin-top: 2px;
}

.edit-actions {
  display: flex;
  gap: 12px;
  margin-top: 6px;
}

.edit-save-btn {
  background: var(--russ-accent);
  color: var(--russ-text-inverse);
  border: none;
  border-radius: 7px;
  padding: 7px 18px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s;
}

.edit-save-btn:hover {
  background: var(--russ-accent-dark);
}

.edit-cancel-btn {
  background: var(--russ-bg-disabled);
  color: var(--russ-text-tertiary);
  border: 1.5px solid var(--russ-border);
  border-radius: 7px;
  padding: 7px 18px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s;
}

.edit-cancel-btn:hover {
  background: #fbe9e7;
  color: var(--russ-error);
}

.add-comment-form {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-top: 22px;
  background: var(--russ-bg-blue-light);
  border-radius: 10px;
  padding: 16px 14px 14px 14px;
  box-shadow: 0 1px 6px var(--russ-shadow-accent-light);
  flex-wrap: wrap;
}

.add-comment-form input[type="text"],
.add-comment-form input[type="search"],
.add-comment-form input[type="email"],
.add-comment-form input[placeholder] {
  font-size: 16px;
  border-radius: 7px;
  border: 1.5px solid var(--russ-info-border);
  padding: 9px 14px;
  min-width: 220px;
  background: #fff;
  flex: 1 1 180px;
}

.add-comment-form input[type="file"] {
  font-size: 14px;
  border-radius: 7px;
  border: 1.5px solid var(--russ-border);
  background: var(--russ-bg-secondary);
  padding: 7px 8px;
  flex: 1 1 120px;
  margin-left: 0;
}

.add-comment-form button {
  min-width: 48px;
  min-height: 48px;
  font-size: 20px;
  border-radius: 7px;
  background: var(--russ-accent);
  color: var(--russ-text-inverse);
  border: none;
  transition: background 0.15s;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px var(--russ-shadow-accent-light);
}

.add-comment-form button:hover {
  background: var(--russ-accent-dark);
}

.add-comment-form input[type="file"]::-webkit-file-upload-button {
  border-radius: 6px;
  background: var(--russ-info-light);
  border: 1px solid var(--russ-info-border);
  color: var(--russ-accent);
  padding: 5px 10px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.add-comment-form input[type="file"]:hover::-webkit-file-upload-button {
  background: #bbdefb;
}

.comments-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 0 24px 0;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--russ-border-light);
  border-top: 3px solid var(--russ-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.spinner-text {
  font-size: 16px;
  color: var(--russ-accent);
  font-weight: 500;
  letter-spacing: 0.2px;
}

@media (max-width: 700px) {
  .modal-content.task-details-modal {
    min-width: 0;
    width: 98vw;
    padding: 18px 6vw 18px 6vw;
  }

  .edit-comment-form {
    gap: 8px;
  }

  .edit-save-btn,
  .edit-cancel-btn {
    font-size: 14px;
    padding: 6px 10px;
  }

  .add-comment-form {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 10px 4vw 10px 4vw;
  }

  .add-comment-form input[type="text"],
  .add-comment-form input[type="search"],
  .add-comment-form input[type="email"],
  .add-comment-form input[placeholder] {
    min-width: 0;
    width: 100%;
  }

  .add-comment-form input[type="file"] {
    width: 100%;
  }
}

/* Стили для файлов задачи */
.task-files-block {
  margin: 24px 0;
  padding: 20px;
  background: var(--russ-bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--russ-border);
}

.task-files-block h3 {
  margin: 0 0 16px 0;
  color: var(--russ-text-secondary);
  font-size: 18px;
  font-weight: 600;
}

.task-files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid var(--russ-border);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.task-file-item:hover {
  border-color: var(--russ-border-dark);
  box-shadow: 0 2px 8px var(--russ-shadow-color);
}

.task-file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.task-file-info i {
  color: var(--russ-text-tertiary);
  font-size: 16px;
}

.task-file-name {
  color: var(--russ-text-secondary);
  font-weight: 500;
  word-break: break-all;
}

.task-file-size {
  color: var(--russ-text-tertiary);
  font-size: 13px;
  white-space: nowrap;
}

.task-file-download {
  color: var(--russ-accent);
  background: var(--russ-info-light);
  border: 1px solid var(--russ-info-border);
  border-radius: 6px;
  padding: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;
}

.task-file-download:hover {
  background: #bbdefb;
  border-color: var(--russ-info-border);
  color: var(--russ-accent-dark);
}

.task-file-download i {
  font-size: 14px;
}
</style>

