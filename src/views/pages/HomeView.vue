<script setup lang="ts">
import { useAccountStore } from '@/stores/account';
const AccountStore = useAccountStore()

function updateName(){
    AccountStore.update({name:'小小课'})
}
</script>

<template>
  <p>这是主页</p>
  <p>当前登录的账号是:{{ AccountStore.account.name }}</p>
  <p>当前登录的邮箱是:{{ AccountStore.account.email }}</p>
  <a-button type="primary" @click="updateName">更新名字</a-button>
  <a-button @click="AccountStore.clear">重置</a-button>
  <router-link to="/space/apps">跳转到应用列表</router-link>
</template>

<style scoped></style>
