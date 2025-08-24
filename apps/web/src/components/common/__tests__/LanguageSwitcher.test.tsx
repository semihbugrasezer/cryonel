import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LanguageSwitcher from '../LanguageSwitcher';

// Mock the useI18n hook
vi.mock('../../../hooks/useI18n', () => ({
  useI18n: () => ({
    changeLanguage: vi.fn(),
    getCurrentLanguage: () => 'en',
    getLanguageLabel: (lang: string) => lang === 'en' ? 'English' : 'Türkçe',
    currentLanguage: 'en',
  }),
}));

describe('LanguageSwitcher', () => {
  it('renders language switcher button', () => {
    render(<LanguageSwitcher />);
    
    expect(screen.getByLabelText('Change language')).toBeInTheDocument();
    expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByLabelText('Change language');
    fireEvent.click(button);
    
    expect(screen.getByText('🇹🇷')).toBeInTheDocument();
    expect(screen.getByText('Türkçe')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByLabelText('Change language');
    fireEvent.click(button);
    
    // Dropdown should be visible
    expect(screen.getByText('🇹🇷')).toBeInTheDocument();
    
    // Click outside
    fireEvent.click(document.body);
    
    // Dropdown should be hidden
    expect(screen.queryByText('🇹🇷')).not.toBeInTheDocument();
  });
});
