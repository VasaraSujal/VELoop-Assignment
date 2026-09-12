const MAX_TRANSACTION_RETRIES = 3;

/**
 * Returns true when the given error is a MongoDB transient transaction error
 * (e.g. WriteConflict) that is safe to retry. Retrying does not weaken
 * concurrency protection: aborted transactions roll back all writes, so a
 * retry can never double-deduct a balance or duplicate a record.
 */
export const isTransientTransactionError = (err) => {
  if (!err || typeof err !== 'object') return false;
  if (typeof err.hasErrorLabel === 'function' && err.hasErrorLabel('TransientTransactionError')) {
    return true;
  }
  return err.code === 112 || err.codeName === 'WriteConflict';
};

/**
 * Returns the bounded number of retry attempts used for transient
 * transaction errors (write conflicts) across the giveaway engine,
 * winner finalization, and prize claim execution paths.
 */
export const getMaxTransactionRetries = () => MAX_TRANSACTION_RETRIES;