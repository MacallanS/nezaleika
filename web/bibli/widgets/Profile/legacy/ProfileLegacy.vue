<template>
  <div class="profile">
    <div v-if="isLoading" class="profile-loader">Загрузка...</div>
    <template v-else>
      <div v-if="isProfileFilled" class="profile-onboarding">
        <div class="profile-onboarding__container">
          <TraineeExpiredCard
            v-if="traineeAccessState === 'trainee_expired'"
            :detailed="true"
          />

          <div v-else-if="showRegistrationPlaque" class="registration-plaque registration-plaque--waiting" role="status">
            <h2 class="registration-plaque__title">Ожидание оформления</h2>
            <p class="registration-plaque__text">
              Вы уже заполнили данные профиля. Сейчас они на проверке — ожидайте оформления.
              После открытия тестового периода или приёма на работу вам станут доступны разделы смен.
              При вопросах обратитесь в поддержку.
            </p>
          </div>

          <!-- Кнопка удаления персональных данных -->
          <div class="clear-data-section">
            <button
              class="clear-data-btn"
              type="button"
              @click="showClearDataModal = true"
              aria-label="Удалить персональные данные"
            >
              <i class="pi pi-trash"></i>
              <span>Удалить данные</span>
            </button>
          </div>

          <div class="profile-accordion">
          <div v-for="section in profileSections" :key="section.key" class="accordion-section">
            <div class="accordion-header" @click="toggleAccordion(section.key)">
              <span>{{ section.title }}</span>
              <span class="accordion-arrow" :class="{ open: openedSections[section.key] }">
                <i v-if="section.key === 'photos'" class="pi pi-chevron-down"></i>
                <i v-else class="pi pi-chevron-down"></i>
              </span>
            </div>
            <transition name="fade">
              <div v-show="openedSections[section.key]" class="accordion-content">
                <component :is="section.component" :filledUserData="filledUserData" :photoFiles="photoFiles"
                  :getFileUrl="getFileUrl" :getAccountTypeName="getAccountTypeName" />
              </div>
            </transition>
          </div>
          </div>

          <!-- Модальное окно подтверждения -->
          <Teleport to="body">
            <div v-if="showClearDataModal" class="clear-data-overlay" @click.self="showClearDataModal = false">
              <div class="clear-data-modal">
                <div class="clear-data-modal__icon">
                  <i class="pi pi-exclamation-triangle"></i>
                </div>
                <h3 class="clear-data-modal__title">Удаление персональных данных</h3>
                <p class="clear-data-modal__text">
                  Вы уверены, что хотите удалить все свои персональные данные? Будут удалены: паспортные данные, email, контактные данные, данные самозанятого/ИП.
                </p>
                <p class="clear-data-modal__warning">
                  Это действие необратимо!
                </p>
                <div class="clear-data-modal__actions">
                  <button class="clear-data-modal__cancel" @click="showClearDataModal = false" :disabled="isClearingData">
                    Отмена
                  </button>
                  <button class="clear-data-modal__confirm" @click="handleClearPersonalData" :disabled="isClearingData">
                    <span v-if="isClearingData">Удаление...</span>
                    <span v-else>Да, удалить</span>
                  </button>
                </div>
              </div>
            </div>
          </Teleport>
        </div>
      </div>
      <div v-else class="profile-onboarding">
        <div class="profile-onboarding__container profile_page">
          <TraineeExpiredCard v-if="traineeAccessState === 'trainee_expired'" />

          <div v-else-if="showRegistrationPlaque" class="registration-plaque registration-plaque--action" role="status">
            <h2 class="registration-plaque__title">Заполните профиль для оформления</h2>
            <p class="registration-plaque__text">
              Чтобы пройти оформление и получить доступ к сменам, заполните контактные данные,
              паспорт, загрузите документы и укажите тип занятости ниже.
            </p>
          </div>

          <div class="profile-steps-progress">Шаг {{ currentStep }} из {{ totalSteps }}</div>

          <!-- Шаг 1: Контактные данные -->
          <template v-if="currentStep === 1">
            <section class="profile-step-content">
              <ProfileStepContacts :form="form" :errors="errors" :is-submitting="isSubmitting"
                :filled-user-data="filledUserData" @update:form="handleFormUpdate"
                @continue="handleFirstStepContinue" />
            </section>
          </template>

          <!-- Шаг 2: Пользовательские данные -->
          <template v-if="currentStep === 2">
            <section class="profile-step-content">
              <ProfileStepPassport :form="form" :errors="errors" :is-submitting="isSubmitting"
                :passport-issued-options="passportIssuedOptions"
                @update:form="handleFormUpdate" @continue="handleSecondStepContinue"
                @back="goBack" />
            </section>
          </template>

          <!-- Шаг 3: Загрузка документов -->
          <template v-if="currentStep === 3">
            <div class="step-panel">
                <section v-if="!allRequiredFilesUploaded || !hasAnyUploadedFile || isInResetMode" class="form-wrapper">
                  <div class="documents-section">
                    <h3 class="documents-title">Загрузка документов</h3>
                    <div class="document-upload-list">
                      <div class="document-upload-row styled-row clickable-upload-row">
                        <div class="document-upload-left">
                          <div class="upload-label">
                            <label class="file-label" @click.stop>
                              <span class="doc-label">Фото паспорта (2,3 страницы)</span>
                              <span class="file-hint">Загрузите разворот паспорта с фото</span>
                              <div class="file-input-wrapper"
                                :class="{ 'file-input-wrapper--error': photoTriedSubmit && !uploadedFiles.passport }">
                                <div class="file-input-badge">
                                  <i class="pi pi-cloud-upload"></i>
                                  <span>Загрузка файла</span>
                                </div>
                                <input type="file" ref="passportInput" @change="handleFileUpload($event, 'passport')"
                                  accept="image/*" class="file-input" />
                                <div class="file-input-display">
                                  <i class="pi pi-upload"></i>
                                  <div class="file-input-texts">
                                    <span class="file-input-main">
                                      {{ uploadedFiles.passport ? 'Файл загружен' : 'Нажмите, чтобы загрузить' }}
                                    </span>
                                    <span class="file-input-sub">
                                      {{
                                        uploadedFiles.passport
                                          ? uploadedFiles.passport.name
                                          : 'Форматы: JPG, PNG, PDF'
                                      }}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </label>
                            <div class="file-input-helper">
                              Это поле обязательно: загрузите разворот паспорта с фотографией.
                            </div>
                            <div v-if="photoErrors.passport" class="error-message">{{ photoErrors.passport }}</div>
                          </div>
                        </div>
                        <div class="document-upload-preview">
                          <div class="photo-preview-box styled-preview">
                            <template v-if="filePreviews.passport">
                              <img :src="filePreviews.passport" alt="Превью паспорта"
                                class="photo-preview-img styled-img" />
                            </template>
                            <template v-else>
                              <div class="photo-placeholder styled-placeholder">

                                Нет фото
                              </div>
                            </template>
                          </div>
                        </div>
                      </div>
                      <div class="document-upload-row styled-row clickable-upload-row">
                        <div class="document-upload-left">
                          <div class="upload-label">
                            <label class="file-label" @click.stop>
                              <span class="doc-label">Фото регистрации (4,5 страницы)</span>
                              <span class="file-hint">Страница с регистрацией</span>
                              <div class="file-input-wrapper"
                                :class="{ 'file-input-wrapper--error': photoTriedSubmit && !uploadedFiles.passport_registration }">
                                <div class="file-input-badge">
                                  <i class="pi pi-cloud-upload"></i>
                                  <span>Загрузка файла</span>
                                </div>
                                <input type="file" ref="passportRegistrationInput"
                                  @change="handleFileUpload($event, 'passport_registration')" accept="image/*"
                                  class="file-input" />
                                <div class="file-input-display">
                                  <i class="pi pi-upload"></i>
                                  <div class="file-input-texts">
                                    <span class="file-input-main">
                                      {{ uploadedFiles.passport_registration ? 'Файл загружен' : 'Нажмите, чтобы загрузить' }}
                                    </span>
                                    <span class="file-input-sub">
                                      {{
                                        uploadedFiles.passport_registration
                                          ? uploadedFiles.passport_registration.name
                                          : 'Форматы: JPG, PNG, PDF'
                                      }}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </label>
                            <div class="file-input-helper">
                              Загрузите страницу паспорта с отметкой о регистрации.
                            </div>
                            <div v-if="photoErrors.passport_registration" class="error-message">{{
                              photoErrors.passport_registration }}</div>
                          </div>
                        </div>
                        <div class="document-upload-preview">
                          <div class="photo-preview-box styled-preview">
                            <template v-if="filePreviews.passport_registration">
                              <img :src="filePreviews.passport_registration" alt="Превью регистрации"
                                class="photo-preview-img styled-img" />
                            </template>
                            <template v-else>
                              <div class="photo-placeholder styled-placeholder">

                                Нет фото
                              </div>
                            </template>
                          </div>
                        </div>
                      </div>
                      <div class="document-upload-row styled-row clickable-upload-row">
                        <div class="document-upload-left">
                          <div class="upload-label">
                            <label class="file-label" @click.stop>
                              <span class="doc-label">Селфи</span>
                              <span class="file-hint">Сделайте селфи, чтобы было хорошо видно ваше лицо</span>
                              <div class="file-input-wrapper"
                                :class="{ 'file-input-wrapper--error': photoTriedSubmit && !uploadedFiles.agent_with_passport }">
                                <div class="file-input-badge">
                                  <i class="pi pi-cloud-upload"></i>
                                  <span>Загрузка файла</span>
                                </div>
                                <input type="file" ref="agentWithPassportInput"
                                  @change="handleFileUpload($event, 'agent_with_passport')" accept="image/*"
                                  class="file-input" />
                                <div class="file-input-display">
                                  <i class="pi pi-upload"></i>
                                  <div class="file-input-texts">
                                    <span class="file-input-main">
                                      {{ uploadedFiles.agent_with_passport ? 'Файл загружен' : 'Нажмите, чтобы загрузить' }}
                                    </span>
                                    <span class="file-input-sub">
                                      {{
                                        uploadedFiles.agent_with_passport
                                          ? uploadedFiles.agent_with_passport.name
                                          : 'Форматы: JPG, PNG'
                                      }}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </label>
                            <div class="file-input-helper">
                              Убедитесь, что лицо хорошо видно и читаемо.
                            </div>
                            <div v-if="photoErrors.agent_with_passport" class="error-message">{{
                              photoErrors.agent_with_passport }}</div>
                          </div>
                        </div>
                        <div class="flex">
                          <div class="example-selfie-block">
                            <img :src="examplePassportImg" alt="Пример фото"
                              class="example-selfie-img" />
                            <div class="example-selfie-caption">Пример фото</div>
                          </div>
                          <div class="document-upload-preview"
                            style="display: flex; flex-direction: column; gap: 10px;">
                            <div class="photo-preview-box styled-preview">
                              <template v-if="filePreviews.agent_with_passport">
                                <img :src="filePreviews.agent_with_passport" alt="Превью селфи"
                                  class="photo-preview-img styled-img" />
                              </template>
                              <template v-else>
                                <div class="photo-placeholder styled-placeholder">Нет фото</div>
                              </template>
                            </div>
                          </div>
                        </div>

                      </div>
                      <div class="document-upload-row styled-row clickable-upload-row">
                        <div class="document-upload-left">
                          <div class="upload-label">
                            <label class="file-label" @click.stop>
                              <span class="doc-label">Фото ИНН</span>
                              <span class="file-hint">Свидетельство о постановке на учет</span>
                              <div class="file-input-wrapper"
                                :class="{ 'file-input-wrapper--error': photoTriedSubmit && !uploadedFiles.file_inn }">
                                <div class="file-input-badge">
                                  <i class="pi pi-cloud-upload"></i>
                                  <span>Загрузка файла</span>
                                </div>
                                <input type="file" ref="fileInnInput" @change="handleFileUpload($event, 'file_inn')"
                                  accept="image/*" class="file-input" />
                                <div class="file-input-display">
                                  <i class="pi pi-upload"></i>
                                  <div class="file-input-texts">
                                    <span class="file-input-main">
                                      {{ uploadedFiles.file_inn ? 'Файл загружен' : 'Нажмите, чтобы загрузить' }}
                                    </span>
                                    <span class="file-input-sub">
                                      {{
                                        uploadedFiles.file_inn
                                          ? uploadedFiles.file_inn.name
                                          : 'Форматы: JPG, PNG, PDF'
                                      }}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </label>
                            <div class="file-input-helper">
                              Загрузите свидетельство о постановке на учет (ИНН).
                            </div>
                            <div v-if="photoErrors.file_inn" class="error-message">{{ photoErrors.file_inn }}</div>
                          </div>
                        </div>
                        <div class="document-upload-preview">
                          <div class="photo-preview-box styled-preview">
                            <template v-if="filePreviews.file_inn">
                              <img :src="filePreviews.file_inn" alt="Превью ИНН" class="photo-preview-img styled-img" />
                            </template>
                            <template v-else>
                              <div class="photo-placeholder styled-placeholder">

                                Нет фото
                              </div>
                            </template>
                          </div>
                        </div>
                      </div>
                      <div class="document-upload-row styled-row clickable-upload-row">
                        <div class="document-upload-left">
                          <div class="upload-label">
                            <label class="file-label" @click.stop>
                              <span class="doc-label">Фото СНИЛС</span>
                              <span class="file-hint">Страховое свидетельство</span>
                              <div class="file-input-wrapper"
                                :class="{ 'file-input-wrapper--error': photoTriedSubmit && !uploadedFiles.file_snils }">
                                <div class="file-input-badge">
                                  <i class="pi pi-cloud-upload"></i>
                                  <span>Загрузка файла</span>
                                </div>
                                <input type="file" ref="fileSnilsInput" @change="handleFileUpload($event, 'file_snils')"
                                  accept="image/*" class="file-input" />
                                <div class="file-input-display">
                                  <i class="pi pi-upload"></i>
                                  <div class="file-input-texts">
                                    <span class="file-input-main">
                                      {{ uploadedFiles.file_snils ? 'Файл загружен' : 'Нажмите, чтобы загрузить' }}
                                    </span>
                                    <span class="file-input-sub">
                                      {{
                                        uploadedFiles.file_snils
                                          ? uploadedFiles.file_snils.name
                                          : 'Форматы: JPG, PNG, PDF'
                                      }}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </label>
                            <div class="file-input-helper">
                              Требуется фото страхового свидетельства (СНИЛС).
                            </div>
                            <div v-if="photoErrors.file_snils" class="error-message">{{ photoErrors.file_snils }}</div>
                          </div>
                        </div>
                        <div class="document-upload-preview">
                          <div class="photo-preview-box styled-preview">
                            <template v-if="filePreviews.file_snils">
                              <img :src="filePreviews.file_snils" alt="Превью СНИЛС"
                                class="photo-preview-img styled-img" />
                            </template>
                            <template v-else>
                              <div class="photo-placeholder styled-placeholder">

                                Нет фото
                              </div>
                            </template>
                          </div>
                        </div>
                      </div>
                      <div class="document-upload-row styled-row clickable-upload-row">
                        <div class="document-upload-left">
                          <div class="upload-label">
                            <label class="file-label" @click.stop>
                              <span class="doc-label">Фото банковских реквизитов</span>
                              <span class="file-hint">Загрузите скан/фото банковских реквизитов</span>
                              <div class="file-input-wrapper"
                                :class="{ 'file-input-wrapper--error': photoTriedSubmit && !uploadedFiles.file_banking_details }">
                                <div class="file-input-badge">
                                  <i class="pi pi-cloud-upload"></i>
                                  <span>Загрузка файла</span>
                                </div>
                                <input type="file" ref="fileBankingDetailsInput"
                                  @change="handleFileUpload($event, 'file_banking_details')" accept="image/*"
                                  class="file-input" />
                                <div class="file-input-display">
                                  <i class="pi pi-upload"></i>
                                  <div class="file-input-texts">
                                    <span class="file-input-main">
                                      {{ uploadedFiles.file_banking_details ? 'Файл загружен' : 'Нажмите, чтобы загрузить' }}
                                    </span>
                                    <span class="file-input-sub">
                                      {{
                                        uploadedFiles.file_banking_details
                                          ? uploadedFiles.file_banking_details.name
                                          : 'Форматы: JPG, PNG, PDF'
                                      }}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </label>
                            <div class="file-input-helper">
                              Приложите документ с банковскими реквизитами для выплат.
                            </div>
                            <div v-if="photoErrors.file_banking_details" class="error-message">{{
                              photoErrors.file_banking_details }}</div>
                          </div>
                        </div>
                        <div class="document-upload-preview">
                          <div class="photo-preview-box styled-preview">
                            <template v-if="filePreviews.file_banking_details">
                              <img :src="filePreviews.file_banking_details" alt="Превью банковских реквизитов"
                                class="photo-preview-img styled-img" />
                            </template>
                            <template v-else>
                              <div class="photo-placeholder styled-placeholder">

                                Нет фото
                              </div>
                            </template>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <div v-else-if="!isInResetMode" class="documents-section uploaded-all-block">
                  <div class="all-uploaded-message">Все документы успешно загружены</div>
                  <div class="uploaded-previews-grid">
                    <template v-for="item in uploadedPreviewFields" :key="'uploaded-' + item.field">
                      <div v-if="uploadedFileIds[item.field]" class="uploaded-preview-item">
                        <img :src="getFileUrl(uploadedFileIds[item.field] ?? undefined)" class="uploaded-preview-img"
                          :alt="item.label" data-fancybox="documents-gallery"
                          :data-src="getFileUrl(uploadedFileIds[item.field] ?? undefined)" :data-caption="item.label" />
                        <div class="uploaded-preview-label">{{ item.label }}</div>
                      </div>
                    </template>
                  </div>
                  <Button label="Выгрузить всё заново" @click="resetAllUploads" class="reupload-btn" />
                </div>
                <div v-else class="documents-section reset-mode-block">
                  <div class="reset-mode-message">Режим перезагрузки документов</div>
                  <div class="reset-mode-hint">Загрузите все документы заново или отмените изменения</div>
                  <div class="reset-mode-buttons">
                    <Button label="Отменить изменения" @click="exitResetMode" class="cancel-reset-btn" />
                  </div>
                </div>
                <div class="button-row spaced">
                  <Button label="Назад" class="p-button-secondary" @click="goBack" />
                  <Button v-if="allRequiredFilesUploaded" label="Пропустить" @click="goToStep(4)" />
                  <Button v-else label="Продолжить" :loading="isSubmitting"
                    @click="handlePhotoStepContinue" />
                </div>
              </div>
            </template>

          <!-- Шаг 4: Почта -->
          <template v-if="currentStep === 4">
            <div class="step-panel">
              <section class="form-section">
                <div class="email-confirm-block">
                  <template v-if="emailAlreadyConfirmed">
                    <div class="confirmed-email-block">
                      <InputText v-model="form.email" name="email" placeholder="E-mail *" class="form-input" readonly
                        disabled />
                      <div class="confirmed-label">Почта подтверждена</div>
                    </div>
                  </template>
                  <template v-else>
                    <InputText v-model="form.email" name="email" placeholder="E-mail *" class="form-input"
                      :class="{ error: errors.email }" :readonly="emailSent" />
                    <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
                    <Button v-if="!emailSent" label="Отправить код на почту" @click="sendEmailCode"
                      :loading="isSendingEmail" />
                    <div v-if="emailSent" class="email-code-block">
                      <InputText v-model="emailCode" name="emailCode" placeholder="Код из письма" class="form-input"
                        :class="{ error: emailCodeError }" maxlength="6" @input="emailCode = String(emailCode).slice(0, 6)"
                      />
                      <div v-if="emailCodeError" class="error-message">{{ emailCodeError }}</div>
                      <Button label="Подтвердить код" @click="verifyEmailCode"
                        :loading="isVerifyingEmail" />
                      <Button label="Отправить код заново" @click="resendEmailCode" :disabled="resendCooldown > 0"
                        class="p-button-secondary" style="margin-top: 0.5rem;">
                        <template #default>
                          <span v-if="resendCooldown > 0">Отправить код заново ({{ resendCooldown }} сек)</span>
                          <span v-else>Отправить код заново</span>
                        </template>
                      </Button>
                    </div>
                  </template>
                </div>
              </section>
              <div class="button-row spaced">
                <Button label="Назад" class="p-button-secondary" @click="goBack" />
                <Button label="Продолжить" @click="goToStep(5)"
                  :disabled="!(form.email && form.email.trim())" />
              </div>
            </div>
          </template>

          <!-- Шаг 5: Тип оформления -->
          <template v-if="currentStep === 5">
            <div class="step-panel">
                <section v-if="!isAgentTypeDataFilled || isInAgentTypeResetMode" class="agent-type-form-section">
                  <label for="agentType" class="agent-type-label">Выберите способ оформления:</label>
                  <div class="select-wrapper">
                    <select v-model="selectedAgentType" id="agentType" class="agent-type-select">
                      <option value="" disabled>Выберите...</option>
                      <option v-for="type in agentTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
                    </select>
                  </div>
                </section>

                <div
                  v-if="(!isAgentTypeDataFilled || isInAgentTypeResetMode) && getAgentTypeNameById(selectedAgentType) === 'Самозанятый'"
                  class="conditional-section">
                  <div class="section-header">
                    <h3>Данные самозанятого</h3>
                  </div>

                  <div class="file-upload-group">
                    <label class="file-label">
                      <span class="file-label-text">Скан/фото справки о статусе самозанятого *</span>
                      <div class="file-input-wrapper">
                        <div class="file-input-badge">
                          <i class="pi pi-cloud-upload"></i>
                          <span>Загрузка файла</span>
                        </div>
                        <input type="file" @change="onSzFileChange($event, 'file_self_employed')" class="file-input"
                          accept="image/*,.pdf" />
                        <div class="file-input-display">
                          <i class="pi pi-upload"></i>
                          <div class="file-input-texts">
                            <span class="file-input-main">
                              {{
                                szForm.file_self_employed || filledUserData?.self_employed?.file_self_employed
                                  ? 'Файл загружен'
                                  : 'Нажмите, чтобы загрузить'
                              }}
                            </span>
                            <span class="file-input-sub">
                              {{
                                szForm.file_self_employed
                                  ? szForm.file_self_employed.name
                                  : filledUserData?.self_employed?.file_self_employed
                                    ? 'Документ уже загружен'
                                    : 'Форматы: JPG, PNG, PDF'
                              }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </label>
                    <div class="file-input-helper">
                      Требуется справка о статусе самозанятого из приложения «Мой налог».
                    </div>
                    <div v-if="szForm.file_self_employed" class="file-preview">
                      <img v-if="szForm.file_self_employed.type.startsWith('image/')"
                        :src="getFilePreview(szForm.file_self_employed)" alt="Превью справки о статусе самозанятого"
                        class="file-preview-img" />
                      <div v-else class="file-preview-placeholder">
                        📄 {{ szForm.file_self_employed.name }}
                      </div>
                    </div>
                    <div v-else-if="filledUserData?.self_employed?.file_self_employed && !isInAgentTypeResetMode"
                      class="file-preview">
                      <div class="uploaded-file-info">
                        <img :src="getFileUrl(filledUserData.self_employed.file_self_employed)"
                          alt="Справка о статусе самозанятого" class="file-preview-img"
                          data-fancybox="documents-gallery"
                          :data-src="getFileUrl(filledUserData.self_employed.file_self_employed)"
                          data-caption="Справка о статусе самозанятого" />
                        <div class="file-info-text">Файл загружен</div>

                      </div>
                    </div>
                  </div>

                  <div class="file-upload-group">
                    <label class="file-label">
                      <span class="file-label-text">Скан/фото справки о доходах *</span>
                      <div class="file-input-wrapper">
                        <div class="file-input-badge">
                          <i class="pi pi-cloud-upload"></i>
                          <span>Загрузка файла</span>
                        </div>
                        <input type="file" @change="onSzFileChange($event, 'file_income_statement')" class="file-input"
                          accept="image/*,.pdf" />
                        <div class="file-input-display">
                          <i class="pi pi-upload"></i>
                          <div class="file-input-texts">
                            <span class="file-input-main">
                              {{
                                szForm.file_income_statement || filledUserData?.self_employed?.file_income_statement
                                  ? 'Файл загружен'
                                  : 'Нажмите, чтобы загрузить'
                              }}
                            </span>
                            <span class="file-input-sub">
                              {{
                                szForm.file_income_statement
                                  ? szForm.file_income_statement.name
                                  : filledUserData?.self_employed?.file_income_statement
                                    ? 'Документ уже загружен'
                                    : 'Форматы: JPG, PNG, PDF'
                              }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </label>
                    <div class="file-input-helper">
                      Загрузите справку о доходах за последние 12 месяцев.
                    </div>
                    <div v-if="szForm.file_income_statement" class="file-preview">
                      <img v-if="szForm.file_income_statement.type.startsWith('image/')"
                        :src="getFilePreview(szForm.file_income_statement)" alt="Превью справки о доходах"
                        class="file-preview-img" />
                      <div v-else class="file-preview-placeholder">
                        📄 {{ szForm.file_income_statement.name }}
                      </div>
                    </div>
                    <div v-else-if="filledUserData?.self_employed?.file_income_statement && !isInAgentTypeResetMode"
                      class="file-preview">
                      <div class="uploaded-file-info">
                        <img :src="getFileUrl(filledUserData.self_employed.file_income_statement)"
                          alt="Справка о доходах" class="file-preview-img" data-fancybox="documents-gallery"
                          :data-src="getFileUrl(filledUserData.self_employed.file_income_statement)"
                          data-caption="Справка о доходах" />
                        <div class="file-info-text">Файл загружен</div>

                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-else-if="(!isAgentTypeDataFilled || isInAgentTypeResetMode) && getAgentTypeNameById(selectedAgentType) === 'Индивидуальный предприниматель'"
                  class="conditional-section">
                  <div class="section-header">
                    <h3>Данные ИП</h3>
                  </div>

                  <div class="form-grid">
                    <div class="form-group">
                      <InputText v-model="ipForm.name" placeholder="ФИО *" class="agent-form-input" />
                    </div>
                    <div class="form-group">
                      <InputText v-model="ipForm.inn" placeholder="ИНН *" class="agent-form-input" />
                    </div>
                    <div class="form-group">
                      <InputText v-model="ipForm.ogrnip" placeholder="ОГРНИП *" class="agent-form-input" />
                    </div>
                  </div>

                  <div class="file-upload-group">
                    <label class="file-label">
                      <span class="file-label-text">Скан/фото ОГРНИП *</span>
                      <div class="file-input-wrapper">
                        <div class="file-input-badge">
                          <i class="pi pi-cloud-upload"></i>
                          <span>Загрузка файла</span>
                        </div>
                        <input type="file" @change="onIpFileChange($event, 'file_ogrnip')" class="file-input"
                          accept="image/*,.pdf" />
                        <div class="file-input-display">
                          <i class="pi pi-upload"></i>
                          <div class="file-input-texts">
                            <span class="file-input-main">
                              {{
                                ipForm.file_ogrnip || filledUserData?.individual_enterepreneur?.file_ogrnip
                                  ? 'Файл загружен'
                                  : 'Нажмите, чтобы загрузить'
                              }}
                            </span>
                            <span class="file-input-sub">
                              {{
                                ipForm.file_ogrnip
                                  ? ipForm.file_ogrnip.name
                                  : filledUserData?.individual_enterepreneur?.file_ogrnip
                                    ? 'Документ уже загружен'
                                    : 'Форматы: JPG, PNG, PDF'
                              }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </label>
                    <div class="file-input-helper">
                      Загрузите свидетельство ОГРНИП или выписку из ЕГРИП.
                    </div>
                    <div v-if="ipForm.file_ogrnip" class="file-preview">
                      <img v-if="ipForm.file_ogrnip.type.startsWith('image/')" :src="getFilePreview(ipForm.file_ogrnip)"
                        alt="Превью ОГРНИП" class="file-preview-img" />
                      <div v-else class="file-preview-placeholder">
                        📄 {{ ipForm.file_ogrnip.name }}
                      </div>
                    </div>
                    <div v-else-if="filledUserData?.individual_enterepreneur?.file_ogrnip && !isInAgentTypeResetMode"
                      class="file-preview">
                      <div class="uploaded-file-info">
                        <img :src="getFileUrl(filledUserData.individual_enterepreneur.file_ogrnip)" alt="ОГРНИП"
                          class="file-preview-img" data-fancybox="documents-gallery"
                          :data-src="getFileUrl(filledUserData.individual_enterepreneur.file_ogrnip)"
                          data-caption="ОГРНИП" />
                        <div class="file-info-text">Файл загружен</div>

                      </div>
                    </div>
                  </div>

                  <div class="form-grid">
                    <div class="form-group">
                      <InputText v-model="ipForm.payment_account" placeholder="Расчетный счет *"
                        class="agent-form-input" />
                    </div>
                    <div class="form-group">
                      <InputText v-model="ipForm.bank" placeholder="Банк *" class="agent-form-input" />
                    </div>
                    <div class="form-group">
                      <InputText v-model="ipForm.bank_bik" placeholder="БИК банка *" class="agent-form-input" />
                    </div>
                    <div class="form-group">
                      <InputText v-model="ipForm.bank_inn" placeholder="ИНН банка *" class="agent-form-input" />
                    </div>
                    <div class="form-group">
                      <InputText v-model="ipForm.correspondent_account" placeholder="Корр. счет *"
                        class="agent-form-input" />
                    </div>
                  </div>

                </div>

                <div v-else-if="isAgentTypeDataFilled && !isInAgentTypeResetMode"
                  class="documents-section uploaded-all-block">
                  <div class="all-uploaded-message">Данные типа оформления заполнены</div>

                  <div class="agent-type-info">
                    <h3>Выбранный тип: {{ getAgentTypeNameById(selectedAgentType) }}</h3>
                  </div>

                  <div v-if="getAgentTypeNameById(selectedAgentType) === 'Самозанятый'" class="filled-data-section">
                    <h4>Документы самозанятого:</h4>
                    <div class="uploaded-previews-grid">
                      <div v-if="filledUserData?.self_employed?.file_self_employed" class="uploaded-preview-item">
                        <img :src="getFileUrl(filledUserData.self_employed.file_self_employed)"
                          class="uploaded-preview-img" alt="Справка о статусе самозанятого"
                          data-fancybox="documents-gallery"
                          :data-src="getFileUrl(filledUserData.self_employed.file_self_employed)"
                          data-caption="Справка о статусе самозанятого" />
                        <div class="uploaded-preview-label">Справка о статусе самозанятого</div>
                      </div>
                      <div v-if="filledUserData?.self_employed?.file_income_statement" class="uploaded-preview-item">
                        <img :src="getFileUrl(filledUserData.self_employed.file_income_statement)"
                          class="uploaded-preview-img" alt="Справка о доходах" data-fancybox="documents-gallery"
                          :data-src="getFileUrl(filledUserData.self_employed.file_income_statement)"
                          data-caption="Справка о доходах" />
                        <div class="uploaded-preview-label">Справка о доходах</div>
                      </div>
                    </div>
                  </div>

                  <div v-else-if="getAgentTypeNameById(selectedAgentType) === 'Индивидуальный предприниматель'"
                    class="filled-data-section">
                    <h4>Данные ИП:</h4>
                    <div class="info-grid">
                      <div><strong>ФИО ИП:</strong> {{ filledUserData?.individual_enterepreneur?.name }}</div>
                      <div><strong>ИНН:</strong> {{ filledUserData?.individual_enterepreneur?.inn }}</div>
                      <div><strong>ОГРНИП:</strong> {{ filledUserData?.individual_enterepreneur?.ogrnip }}</div>
                      <div><strong>Расчетный счет:</strong> {{ filledUserData?.individual_enterepreneur?.payment_account
                      }}</div>
                      <div><strong>Банк:</strong> {{ filledUserData?.individual_enterepreneur?.bank }}</div>
                      <div><strong>БИК банка:</strong> {{ filledUserData?.individual_enterepreneur?.bank_bik }}</div>
                      <div><strong>ИНН банка:</strong> {{ filledUserData?.individual_enterepreneur?.bank_inn }}</div>
                      <div><strong>Корр. счет:</strong> {{
                        filledUserData?.individual_enterepreneur?.correspondent_account }}
                      </div>
                    </div>
                    <div class="uploaded-previews-grid">
                      <div v-if="filledUserData?.individual_enterepreneur?.file_ogrnip" class="uploaded-preview-item">
                        <img :src="getFileUrl(filledUserData.individual_enterepreneur.file_ogrnip)"
                          class="uploaded-preview-img" alt="ОГРНИП" data-fancybox="documents-gallery"
                          :data-src="getFileUrl(filledUserData.individual_enterepreneur.file_ogrnip)"
                          data-caption="ОГРНИП" />
                        <div class="uploaded-preview-label">ОГРНИП</div>
                      </div>
                    </div>
                  </div>

                  <Button label="Перезаполнить" @click="resetAgentTypeData" class="reupload-btn" />
                </div>

              <div v-if="!isAgentTypeDataFilled || isInAgentTypeResetMode" class="button-row spaced">
                <Button label="Назад" class="p-button-secondary" @click="goBack" />
                <Button label="Продолжить" @click="handleAgentTypeContinue"
                  :loading="isSubmitting" />
              </div>
              <div v-else class="button-row spaced">
                <Button label="Назад" class="p-button-secondary" @click="goBack" />
                <Button label="Продолжить" @click="handleAgentTypeContinue" />
              </div>
            </div>
          </template>

          <!-- Шаг 6: Подтверждение -->
          <template v-if="currentStep === 6">
            <div class="step-panel">
                <section class="form-section form-section--plain form-wrapper">
                  <h2 class="section-title">Проверьте и подтвердите данные</h2>
                  <div class="profile-accordion">
                    <div class="accordion-section">
                      <div class="accordion-header" @click="toggleConfirmAccordion('contacts')">
                        <span>Контактные данные</span>
                        <span class="accordion-arrow" :class="{ open: confirmOpenedSections.contacts }">&#9660;</span>
                      </div>
                      <transition name="fade">
                        <div v-show="confirmOpenedSections.contacts" class="accordion-content">
                          <div class="info-grid">
                            <div><strong>Имя:</strong> {{ form.name || "-" }}</div>
                            <div><strong>Фамилия:</strong> {{ form.surname || "-" }}</div>
                            <div><strong>Отчество:</strong> {{ form.noPatronymic ? 'По паспорту нет отчества' : (form.patronymic || '-') }}</div>
                            <div>
                              <strong>Email:</strong>
                              <span :class="{ 'confirmed-email': emailVerified || emailAlreadyConfirmed }">
                                {{ form.email || "-" }}
                                <span v-if="emailVerified || emailAlreadyConfirmed" class="email-verified-badge">✓
                                  Подтверждён</span>
                              </span>
                            </div>
                            <div><strong>ТГ:</strong> {{ formatTelegram(form.telegram_username) }}</div>
                          </div>
                        </div>
                      </transition>
                    </div>

                    <div class="accordion-section">
                      <div class="accordion-header" @click="toggleConfirmAccordion('passport')">
                        <span>Паспортные данные</span>
                        <span class="accordion-arrow" :class="{ open: confirmOpenedSections.passport }">&#9660;</span>
                      </div>
                      <transition name="fade">
                        <div v-show="confirmOpenedSections.passport" class="accordion-content">
                          <div class="info-grid">
                            <div><strong>Паспорт:</strong> {{ form.passport || "-" }}</div>
                            <div><strong>Кем выдан:</strong> {{ form.passport_issued || "-" }}</div>
                            <div><strong>Дата выдачи:</strong> {{ form.passport_date || "-" }}</div>
                            <div><strong>Код подразделения:</strong> {{ form.passport_code || "-" }}</div>
                            <div><strong>Дата рождения:</strong> {{ form.birthday || "-" }}</div>
                            <div><strong>Место рождения:</strong> {{ form.birthday_place || "-" }}</div>
                            <div><strong>Адрес регистрации:</strong> {{ form.registration_address || "-" }}</div>
                            <div><strong>ИНН:</strong> {{ form.inn || "-" }}</div>
                            <div><strong>Расчётный счёт:</strong> {{ form.bank_account || "-" }}</div>
                            <div><strong>БИК банка:</strong> {{ form.bank_bik || "-" }}</div>
                            <div><strong>Название банка:</strong> {{ form.bank_name || "-" }}</div>
                          </div>
                        </div>
                      </transition>
                    </div>

                    <div class="accordion-section">
                      <div class="accordion-header" @click="toggleConfirmAccordion('type')">
                        <span>Тип оформления</span>
                        <span class="accordion-arrow" :class="{ open: confirmOpenedSections.type }">&#9660;</span>
                      </div>
                      <transition name="fade">
                        <div v-show="confirmOpenedSections.type" class="accordion-content">
                          <template
                            v-if="selectedAgentType === '1' || getAgentTypeNameById(selectedAgentType) === 'ГПХ' || getAgentTypeNameById(selectedAgentType) === 'Трудовой договор'">
                            <div class="info-grid">
                              <div><strong>Выбранный тип:</strong> {{ getAgentTypeNameById(selectedAgentType) || "-" }}
                              </div>
                            </div>
                          </template>
                          <template v-else>
                            <div class="info-grid">
                              <div><strong>Выбранный тип:</strong> {{ getAgentTypeNameById(selectedAgentType) || "-" }}
                              </div>
                              <template
                                v-if="getAgentTypeNameById(selectedAgentType) === 'Индивидуальный предприниматель'">
                                <div><strong>ФИО ИП:</strong> {{ filledUserData?.individual_enterepreneur?.name ||
                                  ipForm.name || "-" }}</div>
                                <div><strong>ИНН:</strong> {{ filledUserData?.individual_enterepreneur?.inn ||
                                  ipForm.inn
                                  || "-" }}</div>
                                <div><strong>ОГРНИП:</strong> {{ filledUserData?.individual_enterepreneur?.ogrnip ||
                                  ipForm.ogrnip || "-" }}</div>
                                <div><strong>Расчетный счет:</strong> {{
                                  filledUserData?.individual_enterepreneur?.payment_account || ipForm.payment_account ||
                                  "-" }}</div>
                                <div><strong>Банк:</strong> {{ filledUserData?.individual_enterepreneur?.bank ||
                                  ipForm.bank || "-" }}</div>
                                <div><strong>БИК банка:</strong> {{ filledUserData?.individual_enterepreneur?.bank_bik
                                  ||
                                  ipForm.bank_bik || "-" }}</div>
                                <div><strong>ИНН банка:</strong> {{ filledUserData?.individual_enterepreneur?.bank_inn
                                  ||
                                  ipForm.bank_inn || "-" }}</div>
                                <div><strong>Корр. счет:</strong> {{
                                  filledUserData?.individual_enterepreneur?.correspondent_account ||
                                  ipForm.correspondent_account || "-" }}</div>
                              </template>
                            </div>
                          </template>
                        </div>
                      </transition>
                    </div>

                    <div class="accordion-section">
                      <div class="accordion-header" @click="toggleConfirmAccordion('documents')">
                        <span>Загруженные документы</span>
                        <span class="accordion-arrow" :class="{ open: confirmOpenedSections.documents }">&#9660;</span>
                      </div>
                      <transition name="fade">
                        <div v-show="confirmOpenedSections.documents" class="accordion-content">
                          <div class="uploaded-previews-grid confirmation-previews">
                            <template v-for="item in uploadedPreviewFields" :key="'uploaded-' + item.field">
                              <div v-if="uploadedFileIds[item.field] || uploadedFiles[item.field]"
                                class="uploaded-preview-item">
                                <img :src="uploadedFiles[item.field]
                                  ? (filePreviews[item.field] || '')
                                  : getFileUrl(uploadedFileIds[item.field] ?? undefined)" class="uploaded-preview-img"
                                  :alt="item.label" data-fancybox="documents-gallery" :data-src="uploadedFiles[item.field]
                                    ? filePreviews[item.field]
                                    : getFileUrl(uploadedFileIds[item.field] ?? undefined)"
                                  :data-caption="item.label" />
                                <div class="uploaded-preview-label">{{ item.label }}</div>
                              </div>
                            </template>
                          </div>
                          <template v-if="getAgentTypeNameById(selectedAgentType) === 'Индивидуальный предприниматель'">
                            <div class="documents-subtitle">Документы ИП:</div>
                            <div class="uploaded-previews-grid">
                              <div v-if="filledUserData?.individual_enterepreneur?.file_ogrnip || ipForm.file_ogrnip"
                                class="uploaded-preview-item">
                                <img
                                  :src="filledUserData?.individual_enterepreneur?.file_ogrnip ? getFileUrl(filledUserData.individual_enterepreneur.file_ogrnip) : getFilePreview(ipForm.file_ogrnip)"
                                  class="uploaded-preview-img" alt="ОГРНИП" data-fancybox="documents-gallery"
                                  :data-src="filledUserData?.individual_enterepreneur?.file_ogrnip ? getFileUrl(filledUserData.individual_enterepreneur.file_ogrnip) : getFilePreview(ipForm.file_ogrnip)"
                                  data-caption="ОГРНИП" />
                                <div class="uploaded-preview-label">ОГРНИП</div>
                              </div>
                            </div>
                          </template>
                          <template v-if="getAgentTypeNameById(selectedAgentType) === 'Самозанятый'">
                            <div class="documents-subtitle">Документы самозанятого:</div>
                            <div class="uploaded-previews-grid">
                              <div v-if="filledUserData?.self_employed?.file_self_employed || szForm.file_self_employed"
                                class="uploaded-preview-item">
                                <img
                                  :src="filledUserData?.self_employed?.file_self_employed ? getFileUrl(filledUserData.self_employed.file_self_employed) : getFilePreview(szForm.file_self_employed)"
                                  class="uploaded-preview-img" alt="Справка о статусе самозанятого"
                                  data-fancybox="documents-gallery"
                                  :data-src="filledUserData?.self_employed?.file_self_employed ? getFileUrl(filledUserData.self_employed.file_self_employed) : getFilePreview(szForm.file_self_employed)"
                                  data-caption="Справка о статусе самозанятого" />
                                <div class="uploaded-preview-label">Справка о статусе самозанятого</div>
                              </div>
                              <div
                                v-if="filledUserData?.self_employed?.file_income_statement || szForm.file_income_statement"
                                class="uploaded-preview-item">
                                <img
                                  :src="filledUserData?.self_employed?.file_income_statement ? getFileUrl(filledUserData.self_employed.file_income_statement) : getFilePreview(szForm.file_income_statement)"
                                  class="uploaded-preview-img" alt="Справка о доходах" data-fancybox="documents-gallery"
                                  :data-src="filledUserData?.self_employed?.file_income_statement ? getFileUrl(filledUserData.self_employed.file_income_statement) : getFilePreview(szForm.file_income_statement)"
                                  data-caption="Справка о доходах" />
                                <div class="uploaded-preview-label">Справка о доходах</div>
                              </div>
                            </div>
                          </template>
                        </div>
                      </transition>
                    </div>
                  </div>
              <div class="button-row spaced">
                <Button label="Назад" class="p-button-secondary" @click="goBack" />
                <Button label="Подтвердить данные" @click="submitFinalData" :loading="isSubmitting" />
              </div>
            </section>
            </div>
          </template>
        </div>
      </div>
    </template>
    <PhotoModal :visible="photoModal.visible" :src="photoModal.src" :alt="photoModal.alt" @close="closePhotoModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, reactive, nextTick } from "vue";
import {
  useProfileApi,
  useProfileLegacyExtras,
  useProfileYandexHost,
} from "../composables/useProfileServices";

declare global {
  interface Window {
    $: any;
    jQuery: any;
  }
}

import {
  useToast,
  ProfileSectionContacts,
  ProfileSectionPassport,
  ProfileSectionPhotos,
  ProfileSectionType,
} from "bibli/shared/ui";
import TraineeExpiredCard from "./TraineeExpiredCard.vue";
import { PROFILE_WIZARD_STEP_COUNT } from "./lib/profileSteps";
import {
  sanitizePersonNameInput,
  validateCyrillicName,
} from "bibli/shared/ui/rr/form/composables/useCyrillicNameValidation.js";
import {
  formatTelegramDisplay,
  normalizeTelegramWithPrefix,
  sanitizeTelegramForSubmit,
  stripTelegramUsername,
} from "bibli/widgets/Profile/lib/telegram";
import examplePassportImg from "../rr/assets/example-passport.jpeg";

const {
  submitContactData,
  getAgentTypes,
  setAgentType,
  submitSelfEmployedForm,
  submitIndividualEntrepreneurForm,
  sendUserEmailCode,
  sendUserEmailCodeVerify,
  confirmProfileData,
  getUserData,
  SubmitPassportData,
  uploadPassportDocuments,
  clearPersonalData,
} = useProfileApi();

const {
  user: User,
  isNewUser,
  processImageFile,
  getFmsUnitNamesByCode,
  getUploadUserMessage,
  getLegacyDocumentUrl,
} = useProfileLegacyExtras();

interface FormData {
  name: string;
  surname: string;
  patronymic: string;
  noPatronymic: boolean;
  passport: string;
  passport_issued: string;
  passport_date: string;
  passport_code: string;
  birthday: string;
  birthday_place: string;
  registration_address: string;
  inn: string;
  bank_account: string;
  bank_bik: string;
  bank_name: string;
  email: string;
  telegram_username: string;
}

const toast = useToast();
const { isYandexHost } = useProfileYandexHost();

const currentStep = ref(1);
const totalSteps = computed(() =>
  isYandexHost.value ? 1 : PROFILE_WIZARD_STEP_COUNT,
);

function goToStep(step: number) {
  currentStep.value = step;
}

function goBack() {
  if (currentStep.value > 1) currentStep.value--;
}
const isSubmitting = ref(false);
const photoTriedSubmit = ref(false);
const isLoading = ref(true);
const isInResetMode = ref(false);
const isInAgentTypeResetMode = ref(false);

const form = ref<FormData>({
  name: "",
  surname: "",
  patronymic: "",
  noPatronymic: false,
  passport: "",
  passport_issued: "",
  passport_date: "",
  passport_code: "",
  birthday: "",
  birthday_place: "",
  registration_address: "",
  inn: "",
  bank_account: "",
  bank_bik: "",
  bank_name: "",
  email: "",
  telegram_username: "@",
});

const passportIssuedLookupEnabled = ref(false);
const passportIssuedOptions = ref<string[]>([]);

watch(
  () => form.value.passport_code,
  async (newCode) => {
    if (!passportIssuedLookupEnabled.value) return;

    const digits = (newCode || "").replace(/\D/g, "");
    if (digits.length !== 6) {
      passportIssuedOptions.value = [];
      return;
    }

    const names = await getFmsUnitNamesByCode(digits);
    passportIssuedOptions.value = names;

    // Options are loaded for the agent to choose; do not auto-select.
    // Drop a previously selected value if it is no longer in the list for this code.
    const current = (form.value.passport_issued || "").trim();
    if (current && !names.includes(current)) {
      form.value.passport_issued = "";
    }
  }
);

const errors = ref({
  name: "",
  surname: "",
  patronymic: "",
  passport: "",
  passport_issued: "",
  passport_date: "",
  passport_code: "",
  birthday: "",
  birthday_place: "",
  registration_address: "",
  inn: "",
  bank_account: "",
  bank_bik: "",
  bank_name: "",
  email: "",
  telegram_username: ""
});

const photoErrors = ref({
  passport: "",
  passport_registration: "",
  agent_with_passport: "",
  file_inn: "",
  file_snils: "",
  file_banking_details: ""
});

const emailSent = ref(false);
const isSendingEmail = ref(false);
const emailCode = ref("");
const emailCodeError = ref("");
const isVerifyingEmail = ref(false);
const emailVerified = ref(false);
const resendCooldown = ref(0);
let resendInterval: number | null = null;
const emailAlreadyConfirmed = ref(false);

const ipForm = ref({
  name: '',
  inn: '',
  ogrnip: '',
  file_ogrnip: null as File | null,
  payment_account: '',
  bank: '',
  bank_bik: '',
  bank_inn: '',
  correspondent_account: '',
});

const szForm = ref({
  file_self_employed: null as File | null,
  file_income_statement: null as File | null,
});

const isProfileFilled = ref(false);
const filledUserData = ref<any>(null);

const traineeAccessState = computed(
  () =>
    filledUserData.value?.access_state ??
    filledUserData.value?.trainee?.access_state ??
    null
);

/** REGISTERED: нет меню, только профиль — плашка оформления (не после истёкшего стажёрства). */
const showRegistrationPlaque = computed(() => {
  if (traineeAccessState.value === "trainee_expired") return false;
  if (traineeAccessState.value === "onboarding") return true;
  return isNewUser.value;
});

const agentTypes = ref<{ id: number; name: string }[]>([]);
const selectedAgentType = ref<string>("");

const requiredFileFields: (keyof UploadedFiles)[] = [
  'passport',
  'passport_registration',
  'agent_with_passport',
  'file_inn',
  'file_snils',
  'file_banking_details',
];
const allRequiredFilesUploaded = computed(() => {
  return requiredFileFields.every(f => !fileRequired.value[f] || uploadedFileIds.value[f]);
});

const uploadedPreviewFields = computed(() => {
  return requiredFileFields.map(f => ({ field: f, label: getFileLabel(f) }));
});

const isAgentTypeDataFilled = computed(() => {
  if (!selectedAgentType.value) return false;

  const typeName = getAgentTypeNameById(selectedAgentType.value);
  const typeId = String(selectedAgentType.value);

  if (typeId === '1' || typeName === 'Трудовой договор' || typeName === 'ГПХ') {
    return true;
  }

  if (typeName === 'Самозанятый') {
    return filledUserData.value?.self_employed?.file_self_employed &&
      filledUserData.value?.self_employed?.file_income_statement;
  }

  if (typeName === 'Индивидуальный предприниматель') {
    return filledUserData.value?.individual_enterepreneur?.name &&
      filledUserData.value?.individual_enterepreneur?.inn &&
      filledUserData.value?.individual_enterepreneur?.ogrnip &&
      filledUserData.value?.individual_enterepreneur?.file_ogrnip &&
      filledUserData.value?.individual_enterepreneur?.payment_account &&
      filledUserData.value?.individual_enterepreneur?.bank &&
      filledUserData.value?.individual_enterepreneur?.bank_bik &&
      filledUserData.value?.individual_enterepreneur?.bank_inn &&
      filledUserData.value?.individual_enterepreneur?.correspondent_account;
  }

  return true;
});

const startResendCooldown = () => {
  resendCooldown.value = 60;
  if (resendInterval) clearInterval(resendInterval);
  resendInterval = setInterval(() => {
    if (resendCooldown.value > 0) {
      resendCooldown.value--;
    } else {
      if (resendInterval) clearInterval(resendInterval as unknown as number);
      resendInterval = null;
    }
  }, 1000) as unknown as number;
};

const validateFirstStep = () => {
  let isValid = true;
  errors.value = {
    name: "",
    surname: "",
    patronymic: "",
    passport: "",
    passport_issued: "",
    passport_date: "",
    passport_code: "",
    birthday: "",
    birthday_place: "",
    registration_address: "",
    inn: "",
    bank_account: "",
    bank_bik: "",
    bank_name: "",
    email: "",
    telegram_username: ""
  };

  form.value.name = sanitizePersonNameInput(form.value.name || "");
  form.value.surname = sanitizePersonNameInput(form.value.surname || "");
  form.value.patronymic = sanitizePersonNameInput(form.value.patronymic || "");

  const nameError = validateCyrillicName(form.value.name, {
    emptyMessage: "Имя обязательно для заполнения",
  });
  if (nameError) {
    errors.value.name = nameError;
    isValid = false;
  }

  const surnameError = validateCyrillicName(form.value.surname, {
    emptyMessage: "Фамилия обязательна для заполнения",
  });
  if (surnameError) {
    errors.value.surname = surnameError;
    isValid = false;
  }

  if (!form.value.noPatronymic) {
    const patronymicError = validateCyrillicName(form.value.patronymic, {
      emptyMessage:
        "Отчество обязательно для заполнения или отметьте 'По паспорту нет отчества'",
    });
    if (patronymicError) {
      errors.value.patronymic = patronymicError;
      isValid = false;
    }
  }

  if (ipForm.value.name) {
    ipForm.value.name = sanitizePersonNameInput(ipForm.value.name)
  }

  const telegramRaw = form.value.telegram_username || "";
  const telegramNormalized = sanitizeTelegramForSubmit(telegramRaw);
  const telegramPattern = /^@[A-Za-z0-9_]{5,32}$/;
  if (!telegramNormalized) {
    errors.value.telegram_username = "Укажите Telegram";
    isValid = false;
  } else if (!telegramPattern.test(telegramNormalized)) {
    errors.value.telegram_username = "Допустимы латиница/цифры/_, 5-32 символов (пример: @username)";
    isValid = false;
  } else {
    form.value.telegram_username = telegramNormalized;
  }

  return isValid;
};

const validateSecondStep = () => {
  let isValid = true;
  const requiredFields: (keyof typeof errors.value)[] = [
    'passport',
    'passport_issued',
    'passport_date',
    'passport_code',
    'birthday',
    'birthday_place',
    'registration_address',
    'inn',
    'bank_account',
    'bank_bik',
    'bank_name'
  ];

  for (const field of requiredFields) {
    const value = form.value[field as keyof FormData];

    errors.value[field] = "";

    if (value === null || value === undefined) {
      errors.value[field] = "Это поле обязательно для заполнения";
      isValid = false;
      continue;
    }

    if (typeof value === 'string' && value.trim() === '') {
      errors.value[field] = "Это поле обязательно для заполнения";
      isValid = false;
      continue;
    }
  }

  return isValid;
};

const handleFormUpdate = (updates: Partial<FormData>) => {
  Object.assign(form.value, updates);
};

const handleFirstStepContinue = async () => {
  if (!validateFirstStep()) return;
  isSubmitting.value = true;
  try {
    User.setName(form.value.name);
    User.setSurname(form.value.surname);
    const patronymicValue = form.value.noPatronymic ? null : (form.value.patronymic || null);
    User.setPatronymic(patronymicValue || "");
    const telegramForSubmit = sanitizeTelegramForSubmit(form.value.telegram_username);
    await submitContactData({
      name: form.value.name,
      surname: form.value.surname,
      patronymic: patronymicValue,
      telegram_username: telegramForSubmit,
    });
    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Контактные данные сохранены',
      life: 3000
    });
    if (!isYandexHost.value) goToStep(2);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Ошибка при отправке контактных данных',
      life: 3000
    });
    console.error(error);
  } finally {
    isSubmitting.value = false;
  }
};

interface UploadedFiles {
  passport: File | null;
  passport_registration: File | null;
  agent_with_passport: File | null;
  file_inn: File | null;
  file_snils: File | null;
  file_banking_details: File | null;
}

const uploadedFiles = ref<UploadedFiles>({
  passport: null,
  passport_registration: null,
  agent_with_passport: null,
  file_inn: null,
  file_snils: null,
  file_banking_details: null,
});

const uploadedFileIds = ref<Record<string, string | null>>({
  passport: null,
  passport_registration: null,
  agent_with_passport: null,
  file_inn: null,
  file_snils: null,
  file_banking_details: null,
});

const filePreviews = ref<Record<string, string | null>>({
  passport: null,
  passport_registration: null,
  agent_with_passport: null,
  file_inn: null,
  file_snils: null,
  file_banking_details: null,
});

const handleFileUpload = async (event: Event, type: keyof UploadedFiles) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const originalFile = input.files[0];

    document.body.classList.add('file-uploading');

    try {
      const file = await processImageFile(originalFile);

      uploadedFiles.value[type] = file;
      uploadedFileIds.value[type] = null;
      filePreviews.value[type] = null;
      photoErrors.value[type] = "";

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const previewUrl = e.target?.result as string;
          filePreviews.value[type] = previewUrl;

          setTimeout(() => {
            document.body.classList.remove('file-uploading');
          }, 100);
        };
        reader.readAsDataURL(file);
      } else {
        setTimeout(() => {
          document.body.classList.remove('file-uploading');
        }, 100);
      }
    } catch (error) {
      console.error('Ошибка обработки файла:', error);
      photoErrors.value[type] = "Не удалось обработать файл. Попробуйте другой формат.";
      setTimeout(() => {
        document.body.classList.remove('file-uploading');
      }, 100);
    }
  }
};

const fileRequired = ref<Record<string, boolean>>({
  passport: true,
  passport_registration: true,
  agent_with_passport: true,
  file_inn: true,
  file_snils: true,
  file_banking_details: true,
});

const handleSecondStepContinue = async () => {
  if (!validateSecondStep()) return;
  isSubmitting.value = true;
  try {
    const passportData = {
      passport: form.value.passport,
      passport_issued: form.value.passport_issued,
      passport_date: form.value.passport_date,
      passport_code: form.value.passport_code,
      birthday: form.value.birthday,
      birthday_place: form.value.birthday_place,
      registration_address: form.value.registration_address,
      inn: form.value.inn,
      bank_account: form.value.bank_account,
      bank_bik: form.value.bank_bik,
      bank_name: form.value.bank_name,
    };
    await SubmitPassportData(passportData);
    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Паспортные данные сохранены',
      life: 3000
    });
    goToStep(3);
  } catch (err: unknown) {
    const e = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
    const apiErrors = e.response?.data?.errors;
    const fieldMap: (keyof typeof errors.value)[] = [
      'passport', 'passport_issued', 'passport_date', 'passport_code',
      'birthday', 'birthday_place', 'registration_address',
      'inn', 'bank_account', 'bank_bik', 'bank_name'
    ];
    for (const field of fieldMap) {
      errors.value[field] = "";
    }
    if (apiErrors && typeof apiErrors === 'object') {
      for (const field of fieldMap) {
        const messages = apiErrors[field];
        if (Array.isArray(messages) && messages.length > 0) {
          errors.value[field] = messages[0];
        }
      }
    }
    const detailMsg = apiErrors
      ? Object.values(apiErrors).flat().join('; ')
      : (e.response?.data?.message || 'Ошибка при отправке паспортных данных');
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: detailMsg,
      life: 3000
    });
    console.error(err);
  } finally {
    isSubmitting.value = false;
  }
};

const handlePhotoStepContinue = async () => {
  photoTriedSubmit.value = true;
  const hasUploadedFiles = Object.values(uploadedFiles.value).some(file => file !== null);
  const hasExistingFiles = Object.values(uploadedFileIds.value).some(id => id !== null);

  if (isInResetMode.value) {
    const allFieldsFilled = requiredFileFields.every(field => uploadedFiles.value[field] !== null);
    if (!allFieldsFilled) {
      toast.add({
        severity: 'warn',
        summary: 'Внимание',
        detail: 'Пожалуйста, загрузите все необходимые документы перед продолжением',
        life: 3000
      });
      return;
    }
  }

  if (!hasUploadedFiles && !hasExistingFiles) {
    toast.add({
      severity: 'warn',
      summary: 'Внимание',
      detail: 'Пожалуйста, загрузите необходимые документы перед продолжением',
      life: 3000
    });
    return;
  }

  if (!hasUploadedFiles) {
    goToStep(4);
    return;
  }

  isSubmitting.value = true;
  try {
    const response = await uploadPassportDocuments(
      uploadedFiles.value.passport || null,
      uploadedFiles.value.passport_registration || null,
      uploadedFiles.value.agent_with_passport || null,
      uploadedFiles.value.file_inn || null,
      uploadedFiles.value.file_snils || null,
      uploadedFiles.value.file_banking_details || null
    );
    if (!response.status) throw new Error("Ошибка при загрузке документов");
    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Документы успешно загружены',
      life: 3000
    });
    isInResetMode.value = false;
    goToStep(4);
  } catch (error) {
    console.error("Error uploading files:", error);
    const { summary, detail } = getUploadUserMessage(error, 'documents');
    toast.add({
      severity: 'error',
      summary,
      detail,
      life: 5000
    });
  } finally {
    isSubmitting.value = false;
  }
};

const submitFinalData = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const response = await confirmProfileData();

    if (response.status) {
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Данные профиля подтверждены',
        life: 3000
      });
      await checkProfileFilled();
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.data || 'Не удалось подтвердить данные профиля',
        life: 3000
      });
    }
  } catch (error: any) {
    console.error('Ошибка при подтверждении данных:', error);
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.message || 'Ошибка при подтверждении данных профиля',
      life: 3000
    });
  } finally {
    isSubmitting.value = false;
  }
};

watch(
  form,
  (newValue) => {
    User.setName(newValue.name);
    User.setSurname(newValue.surname);
    const patronymicValue = newValue.noPatronymic ? null : (newValue.patronymic || null);
    User.setPatronymic(patronymicValue || "");
  },
  { deep: true }
);

async function checkProfileFilled() {
  try {
    const typesRes = await getAgentTypes();
    if (typesRes.status && Array.isArray(typesRes.data)) {
      agentTypes.value = typesRes.data.filter((t: { id: number; name: string }) => t.name !== 'ГПХ');
    }

    const userRes = await getUserData();
    if (userRes.status && userRes.data) {
      const user = userRes.data;

      filledUserData.value = user;

      if (user.account_type) {
        const typeStillAvailable = agentTypes.value.some(
          (t: { id: number; name: string }) => String(t.id) === String(user.account_type)
        );
        selectedAgentType.value = typeStillAvailable ? user.account_type : (agentTypes.value[0] ? String(agentTypes.value[0].id) : '');
      }

      form.value = {
        ...form.value,
        name: user.name || "",
        surname: user.surname || "",
        patronymic: user.patronymic || "",
        noPatronymic: false,
        email: user.email || "",
        telegram_username: user.telegram_username ? normalizeTelegramWithPrefix(user.telegram_username) : "@",
      };

      if (user.data) {
        form.value = {
          ...form.value,
          passport: user.data.passport || "",
          passport_issued: user.data.passport_issued || "",
          passport_date: user.data.passport_date || "",
          passport_code: user.data.passport_code || "",
          birthday: user.data.birthday || "",
          birthday_place: user.data.birthday_place || "",
          registration_address: user.data.registration_address || "",
          inn: user.data.inn || "",
          bank_account: user.data.bank_account || "",
          bank_bik: user.data.bank_bik || "",
          bank_name: user.data.bank_name || "",
        };

        uploadedFileIds.value.passport = user.data.file_passport;
        uploadedFileIds.value.passport_registration = user.data.file_passport_registration;
        uploadedFileIds.value.agent_with_passport = user.data.file_agent_with_passport;
        uploadedFileIds.value.file_inn = user.data.file_inn;
        uploadedFileIds.value.file_snils = user.data.file_snils;
        uploadedFileIds.value.file_banking_details = user.data.file_banking_details;
      }

      if (user.individual_enterepreneur) {
        ipForm.value = {
          name: user.individual_enterepreneur.name || '',
          inn: user.individual_enterepreneur.inn || '',
          ogrnip: user.individual_enterepreneur.ogrnip || '',
          file_ogrnip: null,
          payment_account: user.individual_enterepreneur.payment_account || '',
          bank: user.individual_enterepreneur.bank || '',
          bank_bik: user.individual_enterepreneur.bank_bik || '',
          bank_inn: user.individual_enterepreneur.bank_inn || '',
          correspondent_account: user.individual_enterepreneur.correspondent_account || '',
        };

        uploadedFileIds.value.file_ogrnip = user.individual_enterepreneur.file_ogrnip;
      }

      if (user.self_employed) {
        szForm.value = {
          file_self_employed: null,
          file_income_statement: null,
        };

        uploadedFileIds.value.file_self_employed = user.self_employed.file_self_employed;
        uploadedFileIds.value.file_income_statement = user.self_employed.file_income_statement;
      }

      isProfileFilled.value = user.filled === 1;
    } else {
      isProfileFilled.value = false;
      filledUserData.value = null;
    }
  } catch (e) {
    console.error('Error loading profile data:', e);
    isProfileFilled.value = false;
    filledUserData.value = null;
  }
}

onMounted(async () => {
  isLoading.value = true;
  await checkProfileFilled();
  isLoading.value = false;

  try {
    const codeDigits = (form.value.passport_code || "").replace(/\D/g, "");
    if (codeDigits.length === 6) {
      const names = await getFmsUnitNamesByCode(codeDigits);
      passportIssuedOptions.value = names;
    }
  } catch (e) {
    console.error("Не удалось загрузить варианты 'Кем выдан' при загрузке профиля:", e);
  }

  passportIssuedLookupEnabled.value = true;

  await initFancybox();
});

watch([filledUserData, uploadedFileIds], async () => {
  await nextTick();
  if (window.$ && window.$.fancybox) {
    setupFancybox();
  }
}, { deep: true });

async function initFancybox() {
  await nextTick();

  if (!window.$ || !window.$.fancybox) {
    if (!window.$) {
      const jqueryScript = document.createElement('script');
      jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
      jqueryScript.onload = () => {
        loadFancybox();
      };
      document.head.appendChild(jqueryScript);
    } else {
      loadFancybox();
    }
  } else {
    setupFancybox();
  }
}

function loadFancybox() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/@fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.css';
  document.head.appendChild(link);

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.js';
  script.onload = () => {
    setupFancybox();
  };
  document.head.appendChild(script);
}

function setupFancybox() {
  if (window.$ && window.$.fancybox) {
    window.$('[data-fancybox="documents-gallery"]').fancybox({
      buttons: [
        "zoom",
        "slideShow",
        "thumbs",
        "close"
      ],
      loop: true,
      protect: true,
      animationEffect: "fade",
      transitionEffect: "slide",
      thumbs: {
        autoStart: false
      },
      touch: {
        vertical: true,
        momentum: true
      }
    });
  }
}

const sendEmailCode = async () => {
  errors.value.email = "";
  if (!form.value.email || !form.value.email.includes("@")) {
    errors.value.email = "Введите корректный email";
    return;
  }
  isSendingEmail.value = true;
  try {
    await sendUserEmailCode(form.value.email);
    emailSent.value = true;
    startResendCooldown();

    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Код отправлен на почту',
      life: 3000
    });
  } catch (e) {
    const err: any = e;
    const message =
      err?.response?.data?.data ||
      err?.response?.data?.message ||
      err?.message ||
      "Ошибка при отправке письма. Попробуйте позже.";
    toast.add({
      severity: "error",
      summary: "Ошибка",
      detail: message,
      life: 3000,
    });
  } finally {
    isSendingEmail.value = false;
  }
};

const resendEmailCode = async () => {
  if (resendCooldown.value > 0) return;
  await sendEmailCode();
};

const verifyEmailCode = async () => {
  emailCodeError.value = "";
  if (!emailCode.value || emailCode.value.length !== 6) {
    emailCodeError.value = "Введите 6-значный код";
    return;
  }
  isVerifyingEmail.value = true;
  try {
    await sendUserEmailCodeVerify(form.value.email, emailCode.value);
    emailVerified.value = true;
    emailCodeError.value = "";
    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Почта успешно подтверждена',
      life: 3000
    });
    goToStep(5);
  } catch {
    emailCodeError.value = "Неверный код. Попробуйте ещё раз.";
    emailVerified.value = false;
  } finally {
    isVerifyingEmail.value = false;
  }
};

async function onIpFileChange(e: Event, field: 'file_ogrnip') {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    try {
      const originalFile = input.files[0];
      const processedFile = await processImageFile(originalFile);
      ipForm.value[field] = processedFile;
    } catch (error) {
      console.error('Ошибка обработки файла:', error);
    }
  }
}

async function onSzFileChange(e: Event, field: 'file_self_employed' | 'file_income_statement') {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    try {
      const originalFile = input.files[0];
      const processedFile = await processImageFile(originalFile);
      szForm.value[field] = processedFile;
    } catch (error) {
      console.error('Ошибка обработки файла:', error);
    }
  }
}

function resetAgentTypeData() {
  isInAgentTypeResetMode.value = true;
  szForm.value = {
    file_self_employed: null,
    file_income_statement: null,
  };
  ipForm.value = {
    name: '',
    inn: '',
    ogrnip: '',
    file_ogrnip: null,
    payment_account: '',
    bank: '',
    bank_bik: '',
    bank_inn: '',
    correspondent_account: '',
  };
}

function getAgentTypeNameById(id: string | number) {
  if (!id) return '';
  const found = agentTypes.value.find(t => String(t.id) === String(id));
  return found ? found.name : '';
}

async function handleAgentTypeContinue() {
  isSubmitting.value = true;
  try {
    if (!selectedAgentType.value) {
      toast.add({
        severity: 'warn',
        summary: 'Внимание',
        detail: 'Пожалуйста, выберите тип деятельности',
        life: 3000
      });
      isSubmitting.value = false;
      return;
    }
    await setAgentType(selectedAgentType.value);
    const typeName = getAgentTypeNameById(selectedAgentType.value);
    const typeId = String(selectedAgentType.value);
    if (typeId === '1' || typeName === 'Трудовой договор' || typeName === 'ГПХ') {
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: `Тип деятельности выбран: ${typeName || 'Трудовой договор'}`,
        life: 3000
      });
      goToStep(6);
      isSubmitting.value = false;
      return;
    }
    if (typeName === 'Индивидуальный предприниматель') {
      const requiredFields = [
        'name', 'inn', 'ogrnip', 'file_ogrnip', 'payment_account', 'bank', 'bank_bik', 'bank_inn', 'correspondent_account'
      ];
      for (const field of requiredFields) {
        const value = ipForm.value[field as keyof typeof ipForm.value];
        if (typeof value === 'string' && !value.trim()) {
          toast.add({
            severity: 'warn',
            summary: 'Внимание',
            detail: 'Пожалуйста, заполните все поля и загрузите все файлы для ИП',
            life: 3000
          });
          isSubmitting.value = false;
          return;
        }
        if (field === 'file_ogrnip' && !value) {
          toast.add({
            severity: 'warn',
            summary: 'Внимание',
            detail: 'Пожалуйста, загрузите все файлы для ИП',
            life: 3000
          });
          isSubmitting.value = false;
          return;
        }
      }
      await submitIndividualEntrepreneurForm({
        name: ipForm.value.name,
        inn: ipForm.value.inn,
        ogrnip: ipForm.value.ogrnip,
        file_ogrnip: ipForm.value.file_ogrnip as File,
        payment_account: ipForm.value.payment_account,
        bank: ipForm.value.bank,
        bank_bik: ipForm.value.bank_bik,
        bank_inn: ipForm.value.bank_inn,
        correspondent_account: ipForm.value.correspondent_account,
        file_banking_details: new File([], 'dummy.txt'),
      });

      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Данные ИП сохранены',
        life: 3000
      });

      isInAgentTypeResetMode.value = false;
      await checkProfileFilled();
      goToStep(6);
      return;
    }
    if (typeName === 'Самозанятый') {
      if (!szForm.value.file_self_employed || !szForm.value.file_income_statement) {
        toast.add({
          severity: 'warn',
          summary: 'Внимание',
          detail: 'Пожалуйста, загрузите оба файла для самозанятого',
          life: 3000
        });
        isSubmitting.value = false;
        return;
      }
      await submitSelfEmployedForm({
        file_self_employed: szForm.value.file_self_employed,
        file_income_statement: szForm.value.file_income_statement,
      });

      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Данные самозанятого сохранены',
        life: 3000
      });

      isInAgentTypeResetMode.value = false;
      await checkProfileFilled();
      goToStep(6);
      return;
    }
    goToStep(6);
  } catch (e) {
    const { summary, detail } = getUploadUserMessage(e, 'agentType');
    toast.add({
      severity: 'error',
      summary,
      detail,
      life: 5000
    });
  } finally {
    isSubmitting.value = false;
  }
}

function resetAllUploads() {
  const hasAllRequiredFields = requiredFileFields.every(field => {
    const hasUploadedFile = uploadedFiles.value[field] !== null;
    const hasExistingFile = uploadedFileIds.value[field] !== null;
    return hasUploadedFile || hasExistingFile;
  });

  if (!hasAllRequiredFields) {
    toast.add({
      severity: 'warn',
      summary: 'Внимание',
      detail: 'Пожалуйста, заполните все обязательные поля перед сбросом',
      life: 3000
    });
    return;
  }

  requiredFileFields.forEach(f => {
    uploadedFileIds.value[f] = null;
    uploadedFiles.value[f] = null;
    filePreviews.value[f] = null;
  });

  isInResetMode.value = true;
}

function exitResetMode() {
  isInResetMode.value = false;
  if (filledUserData.value?.data) {
    uploadedFileIds.value.passport = filledUserData.value.data.file_passport;
    uploadedFileIds.value.passport_registration = filledUserData.value.data.file_passport_registration;
    uploadedFileIds.value.agent_with_passport = filledUserData.value.data.file_agent_with_passport;
    uploadedFileIds.value.file_inn = filledUserData.value.data.file_inn;
    uploadedFileIds.value.file_snils = filledUserData.value.data.file_snils;
    uploadedFileIds.value.file_banking_details = filledUserData.value.data.file_banking_details;
  }
}

function getFileLabel(field: keyof UploadedFiles) {
  switch (field) {
    case 'passport': return 'Фото паспорта (2,3 страницы)';
    case 'passport_registration': return 'Фото регистрации (4,5 страницы)';
    case 'agent_with_passport': return 'Селфи';
    case 'file_inn': return 'ИНН';
    case 'file_snils': return 'СНИЛС';
    case 'file_banking_details': return 'Банковские реквизиты';
    default: return field;
  }
}

const photoModal = ref<{ visible: boolean; src: string; alt: string }>({ visible: false, src: '', alt: '' });

function closePhotoModal() {
  photoModal.value = { visible: false, src: '', alt: '' };
}

const photoFiles = computed(() => ({
  'Фото паспорта (2,3 страницы)': filledUserData.value?.data?.file_passport,
  'Фото паспорта (4,5 страницы)': filledUserData.value?.data?.file_passport_registration,
  'Селфи': filledUserData.value?.data?.file_agent_with_passport,
  'ИНН': filledUserData.value?.data?.file_inn,
  'СНИЛС': filledUserData.value?.data?.file_snils,
  'Банковские реквизиты': filledUserData.value?.data?.file_banking_details,
}));


function getAccountTypeName(type: string | undefined) {
  if (type === '1') return 'Трудовой договор';
  if (type === 'ip') return 'Индивидуальный предприниматель';
  if (type === 'sz') return 'Самозанятый';
  return type || '-';
}

function formatTelegram(username: string | null | undefined) {
  return formatTelegramDisplay(username);
}

const hasAnyUploadedFile = computed(() => {
  const files = [
    uploadedFileIds.value.passport,
    uploadedFileIds.value.passport_registration,
    uploadedFileIds.value.agent_with_passport,
    uploadedFileIds.value.file_inn,
    uploadedFileIds.value.file_snils,
    uploadedFileIds.value.file_banking_details,
  ];
  return files.some(f => !!f);
});

const openedSections = reactive<{ [key: string]: boolean }>({
  contacts: true,
  passport: false,
  type: false,
});

function toggleAccordion(key: string) {
  openedSections[key] = !openedSections[key];
}

const profileSections = computed(() => {
  const sections = [
    { key: 'contacts', title: 'Контактные данные', component: ProfileSectionContacts },
    { key: 'passport', title: 'Паспортные данные', component: ProfileSectionPassport },
    { key: 'photos', title: 'Фотографии', component: ProfileSectionPhotos },
    { key: 'type', title: 'Тип оформления', component: ProfileSectionType },
  ];

  if (isYandexHost.value) {
    return sections.filter(section => section.key === 'contacts');
  }

  return sections;
});

const confirmOpenedSections = reactive({
  contacts: true,
  passport: true,
  type: true,
  documents: true,
});

type ConfirmSection = keyof typeof confirmOpenedSections;

function toggleConfirmAccordion(key: ConfirmSection) {
  confirmOpenedSections[key] = !confirmOpenedSections[key];
}

function getFilePreview(file: File | null): string {
  if (!file) return '';
  return URL.createObjectURL(file);
}

function getFileUrl(fileId: string | null | undefined): string {
  if (!fileId) return '';
  return getLegacyDocumentUrl(fileId);
}

const showClearDataModal = ref(false);
const isClearingData = ref(false);

async function handleClearPersonalData() {
  isClearingData.value = true;
  try {
    const result = await clearPersonalData();
    if (result?.status) {
      toast.add({ severity: 'success', summary: 'Персональные данные успешно удалены', life: 3000 });
      showClearDataModal.value = false;
      await checkProfileFilled();
    } else {
      toast.add({ severity: 'error', summary: 'Не удалось удалить данные', life: 3000 });
    }
  } catch (e: any) {
    console.error('Error clearing personal data:', e);
    toast.add({ severity: 'error', summary: e?.response?.data?.message || 'Ошибка при удалении данных', life: 4000 });
  } finally {
    isClearingData.value = false;
  }
}
</script>

<style scoped>
.profile {
  padding: 0;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
}

.profile-onboarding {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 0.75rem 1rem;
  box-sizing: border-box;
}

.profile-onboarding__container {
  min-width: 0;
  overflow: hidden;
}

.registration-plaque {
  margin-bottom: 1.25rem;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  line-height: 1.5;
}

.registration-plaque--waiting {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e3a8a;
}

.registration-plaque--action {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.registration-plaque__title {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
}

.registration-plaque__text {
  margin: 0;
  font-size: 0.95rem;
}

.profile-steps-progress {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--russ-text-secondary);
  margin-bottom: 1rem;
}

.profile-step-content {
  min-width: 0;
  max-width: 100%;
}

.profile_page {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  max-width: 100%;
}

.profile_page .step-header {
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--russ-text-secondary);
  border-radius: 8px;
  margin-bottom: 0.25rem;
  flex-shrink: 0;
}

.profile_page .step-header.step-not-filled {
  color: var(--russ-error);
}

.profile_page .step-panel {
  padding: 0;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.profile_page .step-panel .step-panel {
  padding: 0;
  margin-top: 0;
}


.profile_page .form-section {
  max-width: 100%;
  min-width: 0;
  padding: 1rem;
  margin-left: 0;
  margin-right: 0;
} 

.profile_page .input-wrapper,
.profile_page .custom-input {
  min-width: 0;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
}

.profile_page .button-row {
  margin-top: 1rem;
  margin-bottom: 0;
  padding-right: 0;
}

.profile_page .button-row.spaced {
  margin-top: 1.25rem;
}

.profile_page .documents-section,
.profile_page .document-upload-list,
.profile_page .document-upload-row {
  max-width: 100%;
  min-width: 0;
}

.profile_page .form-section .section-title {
  margin-top: 0;
  margin-bottom: 1rem;
}

.profile_page .profile-accordion {
  margin-bottom: 0;
}

.user-card {
  background: var(--russ-bg-secondary);
  border-radius: 22px;
  box-shadow: 0 8px 32px var(--russ-shadow-color);
  padding: 2.5rem 2.2rem 2.2rem 2.2rem;
  margin: 0 auto;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1.5rem;
}

.user-card-header {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 1.2rem;
}

.user-card-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--russ-secondary);
  color: var(--russ-text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1.2rem, calc(1.2rem + (2 - 1.2) * ((100vw - 320px) / (960 - 320))), 2rem);
  font-weight: 600;
  box-shadow: 0 1px 4px var(--russ-shadow-accent-light);
}

.user-card-header h3 {
  font-size: clamp(1.1rem, calc(1.1rem + (1.7 - 1.1) * ((100vw - 320px) / (960 - 320))), 1.7rem);
  font-weight: 700;
  color: var(--russ-primary);
  margin: 0;
}

.user-card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.1rem;
  background: var(--russ-text-inverse);
  border-radius: 16px;
  padding: 1.5rem 1.2rem;
  box-shadow: 0 2px 8px var(--russ-shadow-accent-light);
  font-size: clamp(0.9rem, calc(0.9rem + (1.08 - 0.9) * ((100vw - 320px) / (960 - 320))), 1.08rem);
}

.user-card-grid div {
  display: flex;
  gap: 10px;
  align-items: center;
  border-bottom: 1px solid var(--russ-border);
  padding-bottom: 0.5rem;
}

.user-card-grid div:last-child {
  border-bottom: none;
}

.user-card-grid b {
  color: var(--russ-secondary);
  min-width: 140px;
  font-weight: 600;
}

.user-card-grid span {
  color: var(--russ-primary);
  font-weight: 500;
}

@media (max-width: 700px) {
  .profile-onboarding {
    padding: 0.5rem 0.75rem;
  }

  .profile-onboarding__container {
    max-width: 100%;
  }

  .user-card {
    padding: 1.2rem 0.5rem;
    border-radius: 12px;
    max-width: 98vw;
  }

  .user-card-avatar {
    width: 38px;
    height: 38px;
  }

  .user-card-grid {
    padding: 1rem 0.5rem;
  }

  .user-card-grid b {
    min-width: 90px;
  }

  .profile_page .form-wrapper {
    padding: 0;
  }

  .form-input {
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
  }
}


.profile-readonly-field {
  display: flex;
  gap: 18px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--russ-border);
  margin-bottom: 16px;
}

.profile-readonly-field .profile-label {
  color: var(--russ-secondary);
  min-width: 120px;
  font-weight: 600;
  font-size: 1.05em;
}

.profile-readonly-field .profile-value {
  color: var(--russ-primary);
  font-weight: 500;
  word-break: break-word;
}

.step-panel {
  padding: 1.25rem;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.form-section {
  background: var(--russ-bg-secondary);
  border: 1px solid var(--russ-border);
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--russ-shadow-color);
  padding: 1.25rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.form-section--plain {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}

.form-section--plain.form-wrapper {
  padding: 0;
}

.form-wrapper {
  border-radius: 1rem;
  padding: 1rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.user-data-block {
  background: var(--russ-bg-blue-light);
  border: 1px solid var(--russ-info-border);
}

.form-block-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--russ-text-primary);
  margin-bottom: 0.25rem;
  text-align: left;
}

.form-input {
  width: 100%;
  font-size: clamp(0.8rem, calc(0.8rem + (0.95 - 0.8) * ((100vw - 320px) / (960 - 320))), 0.95rem);
  margin-bottom: 0.5rem;
}

.form-input.error {
  border-color: var(--russ-error);
}

.error-message {
  color: var(--russ-error);
  font-size: clamp(0.75rem, calc(0.75rem + (0.85 - 0.75) * ((100vw - 320px) / (960 - 320))), 0.85rem);
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
}

.patronymic-field-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.no-patronymic-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--russ-text-secondary);
  user-select: none;
}

.no-patronymic-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--russ-accent);
}

.no-patronymic-checkbox span {
  font-weight: 500;
}

.button-row {
  margin: 1.5rem 0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-right: 20px;
}

.button-row.spaced {
  justify-content: space-between;
}

.section-title {
  font-size: clamp(1.1rem, calc(1.1rem + (1.5 - 1.1) * ((100vw - 320px) / (960 - 320))), 1.5rem);
  font-weight: 600;
  color: var(--russ-text-primary);
  margin-bottom: 1.5rem;
  text-align: left;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.25rem;
  padding: 1rem;
  background-color: var(--russ-bg-secondary);
  border-radius: 0.75rem;
}

.info-grid div {
  padding: 0.75rem;
  border-bottom: 1px solid var(--russ-border);
  display: flex;
  align-items: center;
}

.info-grid div:last-child {
  border-bottom: none;
}

.info-grid strong {
  color: var(--russ-text-tertiary);
  margin-right: 0.75rem;
  min-width: 150px;
}


.documents-title {
  font-size: clamp(1rem, calc(1rem + (1.2 - 1) * ((100vw - 320px) / (960 - 320))), 1.2rem);
  font-weight: 600;
  color: var(--russ-text-primary);
  margin-bottom: 1.5rem;
  text-align: left;
}

.document-upload-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.document-upload-row.styled-row {
  background: var(--russ-bg-secondary);
  border-radius: 12px;
  box-shadow: 0 1px 4px var(--russ-shadow-color);
  padding: 1.25rem;
  align-items: stretch;
  border: 1px solid var(--russ-border);
  transition: box-shadow 0.18s, border-color 0.18s;
}

.document-upload-row.styled-row:hover {
  box-shadow: 0 2px 12px var(--russ-shadow-color);
  border-color: var(--russ-border-dark);
}

.clickable-upload-row {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-upload-row:hover {
  box-shadow: 0 6px 20px var(--russ-shadow-accent);
  border-color: var(--russ-info-border);
}

.photo-preview-box.styled-preview {
  border-radius: 10px;
  min-width: 120px;
  max-width: 160px;
  margin-top: 20px;
}

.photo-preview-img.styled-img {
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--russ-shadow-primary-light);
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.photo-placeholder.styled-placeholder {
  background: var(--russ-bg-tertiary);
  color: var(--russ-text-muted);
  border: 1px dashed var(--russ-border);
  border-radius: 10px;
  font-size: clamp(0.9rem, calc(0.9rem + (1 - 0.9) * ((100vw - 320px) / (960 - 320))), 1rem);
  padding: 0.75rem;
  text-align: center;
}

.email-confirm-block {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
  overflow-y: visible;
  box-sizing: border-box;
  /* Место для плавающего лейбла при фокусе (label поднимается на top: -0.625rem) */
  padding-top: 1rem;
}

.email-confirm-block .form-input,
.email-confirm-block .input-wrapper,
.email-confirm-block .custom-input {
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

/* Чтобы лейбл "E-mail *" был виден сверху при фокусе — не обрезать по вертикали */
.email-confirm-block .input-wrapper {
  overflow: visible;
}

.email-code-block {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-hint {
  font-size: clamp(0.75rem, calc(0.75rem + (0.85 - 0.75) * ((100vw - 320px) / (960 - 320))), 0.85rem);
  color: var(--russ-text-muted);
  margin-top: -0.3rem;
  margin-bottom: 0.3rem;
}

.confirmed-label {
  color: var(--russ-success);
  font-weight: 700;
  font-size: clamp(0.95rem, calc(0.95rem + (1.1 - 0.95) * ((100vw - 320px) / (960 - 320))), 1.1rem);
  margin-top: 0.5rem;
}

.confirmed-email-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

.doc-label {
  font-weight: 600;
  color: var(--russ-primary);
  font-size: clamp(0.9rem, calc(0.9rem + (1.08 - 0.9) * ((100vw - 320px) / (960 - 320))), 1.08rem);
  margin-bottom: 0.2rem;
  display: block;
}


@media (max-width: 900px) {
  .profile {
    padding: 0.5rem 0.2rem;
  }

  .profile-accordion {
    gap: 0.7rem;
  }

  .accordion-section {
    border-radius: 10px;
    margin-bottom: 0.7rem;
  }

  .accordion-header {
    padding: 0.7rem 0.7rem;
  }

  .accordion-content {
    padding: 0.7rem 0.5rem;
  }



  .button-row {
    flex-direction: column;
    gap: 0.5rem;
  }

  .profile-table td {
    padding: 0.3rem 0.5rem;
  }
}

@media (max-width: 600px) {
  .profile {
    padding: 0.2rem 0.05rem;
  }

  .profile-accordion {
    gap: 0.4rem;
  }

  .accordion-section {
    border-radius: 7px;
    margin-bottom: 0.4rem;
  }

  .accordion-header {
    padding: 0.5rem 0.4rem;
  }

  .accordion-arrow {
    font-size: 1.1em;
  }

  .accordion-content {
    padding: 0.4rem 0.2rem;
  }

  .button-row {
    flex-direction: column;
    gap: 0.3rem;
  }

  .profile-table td {
    padding: 0.2rem 0.2rem;
  }

  .profile-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding-bottom: 0.15rem;
  }

  .profile-label {
    min-width: 0;
  }

  .profile-section-card {
    padding: 0;
    gap: 0.5rem;
  }

  .confirmation-previews {
    gap: 8px;
  }

  .confirmation-preview-item {
    min-width: 110px;
    max-width: 120px;
    padding: 8px 6px 6px 6px;
  }

  .confirmation-preview-img {
    width: 90px;
    height: 90px;
  }

  .documents-subtitle {
    margin: 0.7rem;
  }
}

.uploaded-all-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  background: var(--russ-bg);
  border: 1px solid var(--russ-border);
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--russ-shadow-color);
  margin-bottom: 1.5rem;
  padding: 1.5rem;
}

.all-uploaded-message {
  color: var(--russ-success);
  font-size: clamp(1rem, calc(1rem + (1.18 - 1) * ((100vw - 320px) / (960 - 320))), 1.18rem);
  font-weight: 600;
  margin-bottom: 1.2rem;
  text-align: center;
}

.reupload-btn {
  background: var(--russ-primary);
  color: var(--russ-text-inverse);
  border-radius: 8px;
  font-weight: 600;
  font-size: clamp(0.9rem, calc(0.9rem + (1.08 - 0.9) * ((100vw - 320px) / (960 - 320))), 1.08rem);
  padding: 10px 28px;
  margin-top: 0.5rem;
  transition: background 0.2s;
}

.reupload-btn:hover {
  background: var(--russ-primary-dark);
}

.reset-mode-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  background: var(--russ-bg-secondary);
  border: 1px solid var(--russ-border);
  border-radius: 14px;
  box-shadow: 0 2px 10px var(--russ-shadow-color);
  margin-bottom: 1.5rem;
  padding: 1.5rem;
}

.reset-mode-message {
  color: var(--russ-warning-text);
  font-size: clamp(1.1rem, calc(1.1rem + (1.3 - 1.1) * ((100vw - 320px) / (960 - 320))), 1.3rem);
  font-weight: 700;
  margin-bottom: 0.8rem;
  text-align: center;
}

.reset-mode-hint {
  color: var(--russ-warning-text);
  font-size: clamp(0.9rem, calc(0.9rem + (1.05 - 0.9) * ((100vw - 320px) / (960 - 320))), 1.05rem);
  margin-bottom: 1.2rem;
  text-align: center;
  max-width: 400px;
}

.reset-mode-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.cancel-reset-btn {
  background: var(--russ-error);
  color: var(--russ-text-inverse);
  border-radius: 8px;
  font-weight: 600;
  font-size: clamp(0.9rem, calc(0.9rem + (1.08 - 0.9) * ((100vw - 320px) / (960 - 320))), 1.08rem);
  padding: 10px 28px;
  transition: background 0.2s;
}

.cancel-reset-btn:hover {
  background: var(--russ-error-dark);
}

.uploaded-previews-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-bottom: 1.2rem;
  justify-content: center;
}

.uploaded-preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: var(--russ-bg-hover);
  border-radius: 10px;
  padding: 14px 16px 10px 16px;
  box-shadow: 0 1px 4px var(--russ-shadow-primary-light);
  min-width: 150px;
  max-width: 180px;
}

.uploaded-preview-img {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 1px 4px var(--russ-shadow-primary-light);
  background: var(--russ-text-inverse);
  cursor: pointer;
  transition: box-shadow 0.18s, transform 0.13s;
}

.uploaded-preview-img:hover {
  box-shadow: 0 4px 16px var(--russ-shadow-accent);
}

.uploaded-preview-label {
  font-size: clamp(0.85rem, calc(0.85rem + (0.97 - 0.85) * ((100vw - 320px) / (960 - 320))), 0.97rem);
  color: var(--russ-primary);
  font-weight: 500;
  text-align: center;
  margin-top: 2px;
}

.photo-modal-overlay {
  position: fixed;
  z-index: 2000;
  inset: 0;
  background: var(--russ-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.photo-modal-content {
  position: relative;
  background: var(--russ-text-inverse);
  border-radius: 16px;
  box-shadow: 0 8px 32px var(--russ-shadow-accent), 0 2px 8px var(--russ-shadow-primary-light);
  padding: 18px 18px 12px 18px;
  max-width: 96vw;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 0.2s;
}

.photo-modal-img {
  max-width: 80vw;
  max-height: 70vh;
  border-radius: 12px;
  box-shadow: 0 2px 12px var(--russ-shadow-primary-light);
  margin-bottom: 10px;
}

.photo-modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1.2rem, calc(1.2rem + (2 - 1.2) * ((100vw - 320px) / (960 - 320))), 2rem);
  font-weight: 900;
  color: var(--russ-primary);
  background: var(--russ-bg);
  border: none;
  border-radius: 50%;
  box-shadow: 0 2px 8px var(--russ-shadow-primary-light);
  cursor: pointer;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.13s;
  z-index: 10;
}

.photo-modal-close:hover {
  background: var(--russ-primary);
  color: var(--russ-text-inverse);
  box-shadow: 0 4px 16px var(--russ-shadow-accent);
}

.photo-modal-caption {
  color: var(--russ-primary);
  font-size: clamp(0.9rem, calc(0.9rem + (1.08 - 0.9) * ((100vw - 320px) / (960 - 320))), 1.08rem);
  font-weight: 600;
  margin-top: 2px;
  text-align: center;
}

.profile-accordion {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.accordion-section {
  border: 1px solid var(--russ-border);
  border-radius: 12px;
  margin-bottom: 0;
  background: var(--russ-bg);
  box-shadow: 0 2px 8px var(--russ-shadow-color);
  overflow: hidden;
  min-width: 0;
  max-width: 100%;
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 1rem 1.25rem;
  font-size: clamp(14px, calc(14px + (18 - 14) * ((100vw - 320px) / (960 - 320))), 18px);
  font-weight: 600;
  color: var(--russ-text-primary);
  background: var(--russ-bg-secondary);
  border-bottom: 1px solid var(--russ-border);
  user-select: none;
  transition: background 0.18s;
}

.accordion-header:hover {
  background: var(--russ-bg-tertiary);
}

.accordion-arrow {
  font-size: 1.2em;
  margin-left: 10px;
  color: var(--russ-text-secondary);
  transition: transform 0.2s;
}

.accordion-arrow.open {
  transform: rotate(180deg);
}

.accordion-content {
  padding: 1.25rem;
  background: var(--russ-bg);
  border-top: none;
  animation: fadeIn 0.2s;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.example-selfie-block {
  margin-top: 6px;
  padding: 8px 10px 6px 10px;
  border: 1.5px dashed var(--russ-border-dark);
  border-radius: 10px;
  background: var(--russ-bg-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 170px;
}

.example-selfie-img {
  max-width: 150px;
  border-radius: 8px;
  box-shadow: 0 1px 4px var(--russ-shadow-primary-light);
  margin-bottom: 4px;
}

.example-selfie-caption {
  font-size: clamp(0.8em, calc(0.8em + (0.95 - 0.8) * ((100vw - 320px) / (960 - 320))), 0.95em);
  color: var(--russ-accent);
  text-align: center;
  font-weight: 500;
}

.photo-placeholder.styled-placeholder {
  color: var(--russ-text-muted);
  font-size: clamp(0.9rem, calc(0.9rem + (1.05 - 0.9) * ((100vw - 320px) / (960 - 320))), 1.05rem);
  text-align: center;
  padding: 1rem;
  background: var(--russ-bg-tertiary);
  border-radius: 10px;
  border: 1px dashed var(--russ-border);
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex {
  display: flex;
  align-items: center;
  gap: 30px;
}

.step-header {
  cursor: pointer;
}

.step-header:hover {
  opacity: 0.8;
}

.step-header.step-not-filled {
  color: var(--russ-input-error) !important;
  font-weight: 600;
}

.confirmed-email-badge {
  color: var(--russ-success);
  font-weight: 700;
}

.email-verified-badge {
  color: var(--russ-success);
  font-weight: 700;
}

.documents-subtitle {
  font-size: clamp(1rem, calc(1rem + (1.2 - 1) * ((100vw - 320px) / (960 - 320))), 1.2rem);
  font-weight: 600;
  color: var(--russ-text-primary);
  margin: 15px;
}

.confirmation-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-bottom: 1.2rem;
  justify-content: center;
}

.confirmation-preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: var(--russ-bg-hover);
  border-radius: 10px;
  padding: 14px 16px 10px 16px;
  box-shadow: 0 1px 4px var(--russ-shadow-primary-light);
  min-width: 150px;
  max-width: 180px;
}

.confirmation-preview-img {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 1px 4px var(--russ-shadow-primary-light);
  background: var(--russ-text-inverse);
  cursor: pointer;
  transition: box-shadow 0.18s, transform 0.13s;
}

.confirmation-preview-img:hover {
  box-shadow: 0 4px 16px var(--russ-shadow-accent);
}

.confirmation-preview-label {
  font-size: clamp(0.85rem, calc(0.85rem + (0.97 - 0.85) * ((100vw - 320px) / (960 - 320))), 0.97rem);
  color: var(--russ-primary);
  font-weight: 500;
  text-align: center;
  margin-top: 2px;
}

/* Простые стили для формы выбора типа агента */
.agent-type-form-section {
  background: var(--russ-bg);
  border: 1px solid var(--russ-border);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 4px var(--russ-shadow-color);
}

.agent-type-label {
  display: block;
  font-size: 1rem;
  font-weight: 500;
  color: var(--russ-text-secondary);
  margin-bottom: 0.75rem;
}

.select-wrapper {
  position: relative;
}

.agent-type-select {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid var(--russ-border-dark);
  border-radius: 6px;
  background: var(--russ-bg);
  color: var(--russ-text-secondary);
  appearance: none;
  cursor: pointer;
}

.agent-type-select:focus {
  outline: none;
  border-color: var(--russ-accent-light);
  box-shadow: 0 0 0 2px var(--russ-shadow-accent-light);
}

.conditional-section {
  background: var(--russ-bg);
  border: 1px solid var(--russ-border);
  border-radius: 12px;
  padding: 1.25rem;
  margin-top: 1rem;
  box-shadow: 0 1px 4px var(--russ-shadow-color);
}

.section-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--russ-border);
}

.section-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--russ-text-secondary);
  margin: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.agent-form-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.95rem;
  border: 1px solid var(--russ-border-dark);
  border-radius: 6px;
  background: var(--russ-text-inverse)fff;
  color: var(--russ-text-secondary);
}

.agent-form-input:focus {
  outline: none;
  border-color: var(--russ-accent-light);
  box-shadow: 0 0 0 2px var(--russ-shadow-accent-light);
}

.file-upload-group {
  margin-bottom: 1rem;
}

.file-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
}

.file-label-text {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--russ-text-primary);
}

.file-input-wrapper {
  position: relative;
  border: 1.5px dashed var(--russ-border-dark);
  border-radius: 14px;
  background: var(--russ-bg-quaternary);
  padding: 18px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  box-shadow: inset 0 0 0 1px var(--russ-border);
}

.file-input-wrapper--error {
  border-color: var(--russ-input-error);
  background: var(--russ-error-light);
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.file-input-display {
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: none;
  color: var(--russ-text-primary);
  border: 1px solid var(--russ-info-light);
  background: var(--russ-info-light);
  border-radius: 12px;
  padding: 12px 16px;
}

.file-input-display i {
  color: var(--russ-accent);
  font-size: 1.2rem;
}

.file-input-texts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-input-main {
  font-weight: 600;
  font-size: 0.95rem;
}

.file-input-sub {
  font-size: 0.85rem;
  color: var(--russ-text-muted);
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-input-display span {
  font-size: 0.9rem;
}

.file-input-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--russ-text-muted);
  margin-bottom: 10px;
}

.file-input-badge .pi {
  font-size: 0.85rem;
  color: var(--russ-accent);
}

.file-input-helper {
  margin-top: 6px;
  font-size: 0.8rem;
  color: var(--russ-text-muted);
}

.file-preview {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--russ-bg-secondary);
  border: 1px solid var(--russ-border);
  border-radius: 6px;
}

.file-preview-img {
  max-width: 200px;
  max-height: 150px;
  border-radius: 4px;
  box-shadow: 0 1px 3px var(--russ-shadow-color);
  object-fit: cover;
}

.file-preview-placeholder {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--russ-bg);
  border: 1px solid var(--russ-border);
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--russ-text-secondary);
}

/* Мобильные стили */
@media (max-width: 768px) {
  .agent-type-form-section {
    padding: 1rem;
  }

  .conditional-section {
    padding: 1rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .section-header {
    margin-bottom: 0.75rem;
  }

  .section-header h3 {
    font-size: 1rem;
  }

  .agent-type-select,
  .agent-form-input {
    padding: 0.625rem;
    font-size: 0.9rem;
  }

  .file-input-display {
    padding: 0.625rem;
    min-height: 44px;
  }


  .document-upload-list {
    gap: 0.5rem;
  }

  .flex {
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
  }
}

.agent-type-info {
  margin: 20px 0;
  padding: 15px;
  background: var(--russ-bg-secondary);
  border-radius: 8px;
  border-left: 4px solid var(--russ-accent);
}

.agent-type-info h3 {
  margin: 0;
  color: var(--russ-accent);
  font-size: 1.1rem;
}

.filled-data-section {
  margin: 20px 0;
}

.filled-data-section h4 {
  margin: 0 0 15px 0;
  color: var(--russ-text-tertiary);
  font-size: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 10px;
  margin: 15px 0;
  padding: 15px;
  background: var(--russ-bg-secondary);
  border-radius: 8px;
}

.info-grid div {
  padding: 8px 0;
  border-bottom: 1px solid var(--russ-border);
}

.info-grid div:last-child {
  border-bottom: none;
}

.info-grid strong {
  color: var(--russ-text-tertiary);
  margin-right: 8px;
}

.reupload-btn {
  margin-top: 20px;
  background: var(--russ-neutral) !important;
  border-color: var(--russ-neutral) !important;
}

.reupload-btn:hover {
  background: var(--russ-neutral-dark) !important;
  border-color: var(--russ-neutral-dark) !important;
}

@media (max-width: 900px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
<style scoped>
@media (max-width: 600px) {

  .step-panel,
  .form-section,
  .profile-accordion,
  .accordion-content {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    word-break: break-word;
  }

  .uploaded-previews-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .uploaded-preview-img,
  .file-preview-img {
    max-width: 100%;
    height: auto;
  }

  .section-title {
    font-size: 1.05rem;
    line-height: 1.3;
  }
}

/* Кнопка удаления персональных данных */
.clear-data-section {
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: flex-end;
}

.clear-data-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1;
  color: var(--russ-text-secondary);
  background: var(--russ-bg);
  border: 1px solid var(--russ-border);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.1s;
}

.clear-data-btn:hover {
  color: var(--russ-legacy-b42318);
  background: var(--russ-bg-secondary);
  border-color: var(--russ-legacy-f3b8b5);
}

.clear-data-btn:active {
  transform: scale(0.96);
}

.clear-data-btn .pi {
  font-size: 0.95rem;
  color: var(--russ-legacy-b42318);
}

@media (max-width: 600px) {
  .clear-data-section {
    justify-content: stretch;
  }

  .clear-data-btn {
    width: 100%;
  }
}

/* Модальное окно подтверждения удаления */
.clear-data-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--russ-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.clear-data-modal {
  background: var(--russ-text-inverse);
  border-radius: 16px;
  padding: 2rem 2.5rem;
  max-width: 440px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  animation: clearDataModalIn 0.2s ease;
}

@keyframes clearDataModalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.clear-data-modal__icon {
  margin-bottom: 1rem;
}

.clear-data-modal__icon .pi {
  font-size: 2.5rem;
  color: var(--russ-legacy-e53935);
}

.clear-data-modal__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--russ-legacy-1a1a1a);
  margin: 0 0 0.75rem 0;
}

.clear-data-modal__text {
  font-size: 0.95rem;
  color: var(--russ-legacy-555);
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
}

.clear-data-modal__warning {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--russ-legacy-e53935);
  margin: 0 0 1.5rem 0;
}

.clear-data-modal__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.clear-data-modal__cancel {
  padding: 10px 24px;
  font-size: 0.95rem;
  font-weight: 600;
  border: 1px solid var(--russ-legacy-ddd);
  border-radius: 8px;
  background: var(--russ-legacy-f5f5f5);
  color: var(--russ-legacy-333);
  cursor: pointer;
  transition: background 0.2s;
}

.clear-data-modal__cancel:hover {
  background: var(--russ-legacy-e0e0e0);
}

.clear-data-modal__confirm {
  padding: 10px 24px;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background: var(--russ-legacy-e53935);
  color: var(--russ-text-inverse);
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}

.clear-data-modal__confirm:hover {
  background: var(--russ-legacy-c62828);
}

.clear-data-modal__confirm:disabled,
.clear-data-modal__cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .clear-data-modal {
    padding: 1.5rem 1.25rem;
  }

  .clear-data-modal__actions {
    flex-direction: column;
  }

  .clear-data-modal__cancel,
  .clear-data-modal__confirm {
    width: 100%;
  }
}
</style>
