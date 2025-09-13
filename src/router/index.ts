import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import NoteEditor from '../views/NoteEditor.vue';
import ReviewCenter from '../views/ReviewCenter.vue';
import Settings from '../views/Settings.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
  },
  {
    path: '/note/:id?',
    name: 'NoteEditor',
    component: NoteEditor,
    props: true,
  },
  {
    path: '/review',
    name: 'ReviewCenter',
    component: ReviewCenter,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
