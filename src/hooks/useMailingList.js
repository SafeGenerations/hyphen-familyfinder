import { useState } from 'react';

const useMailingList = () => {
  const [showMailingListModal, setShowMailingListModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [mailingListEmail, setMailingListEmail] = useState('');
  const [isMailingListSubmitting, setIsMailingListSubmitting] = useState(false);
  const [hasSignedUpForMailingList, setHasSignedUpForMailingList] = useState(
    localStorage.getItem('genogram_mailing_list_signup') === 'true'
  );

  const checkMailingListSignup = (action) => {
    if (hasSignedUpForMailingList) {
      action();
    } else {
      setPendingAction(() => action);
      setShowMailingListModal(true);
    }
  };

  const handleMailingListSignup = () => {
    window.open('https://lp.constantcontactpages.com/su/juEdcCk', '_blank');
    localStorage.setItem('genogram_mailing_list_signup', 'true');
    setHasSignedUpForMailingList(true);
    setShowMailingListModal(false);
    setMailingListEmail('');

    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleSkipSignup = () => {
    setShowMailingListModal(false);
    setMailingListEmail('');

    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  return {
    showMailingListModal,
    mailingListEmail,
    setMailingListEmail,
    isMailingListSubmitting,
    setIsMailingListSubmitting,
    checkMailingListSignup,
    handleMailingListSignup,
    handleSkipSignup
  };
};

export default useMailingList;
