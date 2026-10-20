import { Session } from "../../models/index.js";
import env from "../../config/env.js";
import { randomToken, sha256 } from "../../utils/crypto.js";
import ApiError from "../../utils/ApiError.js";
import { signAccessToken } from "../../utils/tokens.js";
import logger from "../../utils/logger.js";

const refreshExpiry = () => new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 864e5);

export async function createSession(user, req, family = randomToken(16)) {
  const refreshToken = randomToken(48);
  await Session.create({
    user: user._id,
    family,
    tokenHash: sha256(refreshToken),
    userAgent: req.get("user-agent")?.slice(0, 200),
    ip: req.ip,
    expiresAt: refreshExpiry(),
  });
  return { accessToken: signAccessToken(user), refreshToken };
}

/**
 * Rotates a refresh token. Presenting an already-rotated token means it was
 * copied, so the whole family is revoked and the user must sign in again.
 */
export async function rotateSession(refreshToken, req, loadUser) {
  if (!refreshToken) throw ApiError.unauthorized("No active session");
  const session = await Session.findOne({ tokenHash: sha256(refreshToken) });
  if (!session || session.expiresAt < new Date()) throw ApiError.unauthorized("Session expired");
  if (session.revoked) {
    await Session.updateMany({ family: session.family }, { revoked: true });
    logger.warn({ user: session.user }, "Refresh token reuse detected; family revoked");
    throw ApiError.unauthorized("Session expired. Sign in again.");
  }
  const user = await loadUser(session.user);
  if (!user || user.status === "banned" || user.deletedAt) throw ApiError.unauthorized();

  const next = await createSession(user, req, session.family);
  session.revoked = true;
  session.replacedBy = sha256(next.refreshToken);
  await session.save();
  return { user, ...next };
}

export async function revokeByToken(refreshToken) {
  if (!refreshToken) return;
  const session = await Session.findOne({ tokenHash: sha256(refreshToken) });
  if (session) await Session.updateMany({ family: session.family }, { revoked: true });
}
