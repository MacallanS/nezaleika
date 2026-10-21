<template>
  <DataTable
    :value="users"
    paginator
    :rows="5"
    :rowsPerPageOptions="[5, 10, 20, 50]"
    tableStyle="min-width: 50rem"
  >
    <Column field="fio" header="ФИО" />
    <Column field="phone" header="Телефон" />
    <Column field="email" header="E-mail" />
    <Column field="organization" header="Организация" />
    <Column field="role" header="Роль" />
  </DataTable>
</template>

<script setup>
defineProps({
  users: {
    type: Array,
    required: true,
  },
});
</script>
