import AppError, { conflict, badRequest, forbidden } from '../errors/AppError.js';

export function mapDbError(err) {

    if (err?.code === 'ER_DUP_ENTRY' || err?.errno === 1062) {

        return conflict('DUPLICATE', 'Duplicate entry', { raw: err.sqlMessage });
    }
    if (err?.code === 'ER_ROW_IS_REFERENCED_2' || err?.errno === 1451) {
        return forbidden('FK_CONSTRAINT', 'Resource is referenced by other records', { raw: err.sqlMessage });
    }
    if (err?.code === 'ER_NO_REFERENCED_ROW_2' || err?.errno === 1452) {
        return badRequest('FK_NOT_FOUND', 'Referenced resource not found', { raw: err.sqlMessage });
    }

    return err;
}
