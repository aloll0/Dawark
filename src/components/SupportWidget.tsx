'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface SupportWidgetProps {
  clinicName?: string;
}

export function SupportWidget({ clinicName }: SupportWidgetProps) {
  const phone = '201010428244';
  const message = clinicName
    ? encodeURIComponent(`Hello Dawrak Support, I need assistance with our clinic (${clinicName}).`)
    : encodeURIComponent('Hello Dawrak Support, I need assistance with Dawrak Queue System.');

  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  return (
    <aside aria-label="Technical Support" className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      <div className="hidden sm:block bg-[#123B4A] text-[#F7FAFC] text-xs font-medium py-1.5 px-3 rounded shadow border border-[#176B68]">
        Need help? WhatsApp Technical Support
      </div>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact Dawrak Technical Support on WhatsApp"
        className="w-14 h-14 bg-[#36B8A4] hover:bg-[#2fa391] text-[#123B4A] rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#123B4A]"
      >
        <MessageCircle className="w-7 h-7 stroke-[2.2]" />
      </a>
    </aside>
  );
}

export default SupportWidget;
