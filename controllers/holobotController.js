const holobotService = require('../services/holobotServices');
const { parsePagination } = require('../utils/pagination');

exports.chat = async (req, res, next) => {
    try {
        const response = await holobotService.sendMessage(req.user, req.body);
        res.json(response);
    } catch (err) {
        next(err);
    }
};

// Server-Sent Events: `delta` events carry text chunks, then one `done` event
// with the full reply (or an `error` event if the stream fails midway).
exports.chatStream = async (req, res, next) => {
    const controller = new AbortController();
    res.on('close', () => controller.abort());

    const send = (event, data) => {
        if (!res.headersSent) {
            res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
            res.flushHeaders();
        }
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
        const result = await holobotService.streamMessage(req.user, req.body, {
            signal: controller.signal,
            onDelta: (delta) => send('delta', { delta })
        });
        if (!result.aborted) send('done', result);
        res.end();
    } catch (err) {
        if (!res.headersSent) return next(err);
        send('error', { message: err.statusCode ? err.message : 'Holobot stream failed' });
        res.end();
    }
};

exports.getUsage = async (req, res, next) => {
    try {
        const usage = await holobotService.getUsage(req.user._id);
        res.json(usage);
    } catch (err) {
        next(err);
    }
};

exports.getHistory = async (req, res, next) => {
    try {
        const history = await holobotService.getHistory(req.user._id, parsePagination(req.query));
        res.json(history);
    } catch (err) {
        next(err);
    }
};

exports.clearHistory = async (req, res, next) => {
    try {
        const result = await holobotService.clearHistory(req.user._id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.getSettings = async (req, res, next) => {
    try {
        const settings = await holobotService.getSettings(req.user);
        res.json(settings);
    } catch (err) {
        next(err);
    }
};

exports.updateSettings = async (req, res, next) => {
    try {
        const settings = await holobotService.updateSettings(req.user._id, req.body);
        res.json(settings);
    } catch (err) {
        next(err);
    }
};
