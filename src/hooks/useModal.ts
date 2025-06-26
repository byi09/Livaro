import { useState } from 'react';

export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const openModal = (property: any) => {
    setSelectedProperty(property);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedProperty(null);
  };

  return { isOpen, openModal, closeModal, selectedProperty };
};
