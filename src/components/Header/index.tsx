import styles from './header.module.scss';
import Link from 'next/link';
export function Header() {

    return (
        <header className={styles.headerContainer}>
            <div className={styles.headerContent}>
                <img src="/logo.svg" alt="logo" />
            </div>
        </header>
    );
}