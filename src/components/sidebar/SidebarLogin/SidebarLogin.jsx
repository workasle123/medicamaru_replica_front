'use client';

import Link from 'next/link';

import SideBox from '../SideBox/SideBox';
import { IconUser } from '../icons';
import LoginForm from '@/app/(auth)/login/LoginForm';
import { useAccountSummary } from '@/components/layout/Header/useAccountSummary';
import styles from './SidebarLogin.module.css';

/**
 * SidebarLogin — the login box at the top of the right-hand column, or the
 * member links once signed in.
 *
 * Sign-in state comes from /api/account/summary, as the header's does, so the
 * page around it stays prerendered: reading the session cookie on the server
 * would make every render of the page dynamic.
 *
 * A successful login goes to マイページ (the form's default) rather than back
 * here. Coming back to the same path would not refetch the summary, and the
 * header and this box would both go on saying ログイン.
 */
export default function SidebarLogin() {
  const summary = useAccountSummary();

  // Unresolved: hold the space rather than guess — see AccountAction.
  if (summary === null) {
    return <div className={styles.pending} aria-hidden="true" />;
  }

  if (summary.signedIn) {
    return (
      <SideBox id="side-account" title="会員メニュー" icon={<IconUser />}>
        <p className={styles.greeting}>
          {summary.name ? `${summary.name} 様` : 'ようこそ'}
        </p>
        <ul className={styles.menu}>
          <li>
            <Link href="/my-account">マイページ</Link>
          </li>
          <li>
            <Link href="/my-account/orders">注文履歴</Link>
          </li>
          <li>
            <Link href="/wishlist">お気に入り</Link>
          </li>
        </ul>
      </SideBox>
    );
  }

  return (
    <SideBox id="side-login" title="会員ログイン" icon={<IconUser />}>
      <LoginForm />

      <Link href="/forgot-password" className={styles.forgot}>
        パスワードをお忘れの方
      </Link>

      <div className={styles.register}>
        <p className={styles.registerLead}>はじめてご利用の方</p>
        <Link href="/register" className={styles.registerLink}>
          新規会員登録
        </Link>
      </div>
    </SideBox>
  );
}
