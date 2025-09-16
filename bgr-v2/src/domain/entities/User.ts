/**
 * User Entity - Clean Architecture Domain Layer
 * ユーザーのビジネスルールと制約を含むエンティティ
 */

import { ValidationError } from '../errors/DomainErrors'

export interface UserProps {
  readonly id: string
  readonly email?: string
  readonly username?: string
  readonly fullName?: string
  readonly avatarUrl?: string
  readonly website?: string
  readonly isAdmin: boolean
  readonly isActive: boolean
  readonly emailVerified: boolean
  readonly lastLoginAt?: Date
  readonly createdAt?: Date
  readonly updatedAt?: Date
}

export class User {
  private readonly _id: string
  private readonly _email?: string
  private readonly _username?: string
  private readonly _fullName?: string
  private readonly _avatarUrl?: string
  private readonly _website?: string
  private readonly _isAdmin: boolean
  private readonly _isActive: boolean
  private readonly _emailVerified: boolean
  private readonly _lastLoginAt?: Date
  private readonly _createdAt?: Date
  private readonly _updatedAt?: Date

  constructor(props: UserProps) {
    this.validateProps(props)
    
    this._id = props.id
    this._email = props.email
    this._username = props.username?.trim()
    this._fullName = props.fullName?.trim()
    this._avatarUrl = props.avatarUrl
    this._website = props.website
    this._isAdmin = props.isAdmin
    this._isActive = props.isActive
    this._emailVerified = props.emailVerified
    this._lastLoginAt = props.lastLoginAt
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
  }

  private validateProps(props: UserProps): void {
    // ID validation
    if (!props.id || props.id.trim().length === 0) {
      throw new ValidationError(['User ID is required'])
    }

    // Email validation
    if (props.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(props.email)) {
        throw new ValidationError(['Invalid email format'])
      }
      if (props.email.length > 254) {
        throw new ValidationError(['Email must be 254 characters or less'])
      }
    }

    // Username validation
    if (props.username) {
      const username = props.username.trim()
      if (username.length < 2) {
        throw new ValidationError(['Username must be at least 2 characters'])
      }
      if (username.length > 50) {
        throw new ValidationError(['Username must be 50 characters or less'])
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        throw new ValidationError(['Username can only contain letters, numbers, underscores, and hyphens'])
      }
    }

    // Full name validation
    if (props.fullName) {
      const fullName = props.fullName.trim()
      if (fullName.length === 0) {
        throw new ValidationError(['Full name cannot be empty if provided'])
      }
      if (fullName.length > 100) {
        throw new ValidationError(['Full name must be 100 characters or less'])
      }
    }

    // Avatar URL validation
    if (props.avatarUrl) {
      try {
        new URL(props.avatarUrl)
      } catch {
        throw new ValidationError(['Invalid avatar URL format'])
      }
    }

    // Website validation
    if (props.website) {
      try {
        const url = new URL(props.website)
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new ValidationError(['Website must use HTTP or HTTPS protocol'])
        }
      } catch {
        throw new ValidationError(['Invalid website URL format'])
      }
    }
  }

  // Getters
  get id(): string { return this._id }
  get email(): string | undefined { return this._email }
  get username(): string | undefined { return this._username }
  get fullName(): string | undefined { return this._fullName }
  get avatarUrl(): string | undefined { return this._avatarUrl }
  get website(): string | undefined { return this._website }
  get isAdmin(): boolean { return this._isAdmin }
  get isActive(): boolean { return this._isActive }
  get emailVerified(): boolean { return this._emailVerified }
  get lastLoginAt(): Date | undefined { return this._lastLoginAt }
  get createdAt(): Date | undefined { return this._createdAt }
  get updatedAt(): Date | undefined { return this._updatedAt }

  // Business Logic Methods

  /**
   * 表示名を取得（fullName > username > email > ID の優先順）
   */
  getDisplayName(): string {
    if (this._fullName) return this._fullName
    if (this._username) return this._username
    if (this._email) return this._email
    return this._id
  }

  /**
   * プロフィールの初期文字を取得（アバター表示用）
   */
  getInitial(): string {
    const displayName = this.getDisplayName()
    return displayName.charAt(0).toUpperCase()
  }

  /**
   * プロフィールが完成しているかどうか判定
   */
  isProfileComplete(): boolean {
    return !!(this._username && this._fullName && this._avatarUrl)
  }

  /**
   * 新規ユーザーかどうか判定（作成から7日以内）
   */
  isNewUser(): boolean {
    if (!this._createdAt) return false
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return this._createdAt > sevenDaysAgo
  }

  /**
   * アクティブなユーザーかどうか判定（最終ログインから30日以内）
   */
  isActiveUser(): boolean {
    if (!this._lastLoginAt) return false
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return this._lastLoginAt > thirtyDaysAgo
  }

  /**
   * 管理者権限でアクションを実行可能かどうか
   */
  canPerformAdminActions(): boolean {
    return this._isAdmin && this._isActive && this._emailVerified
  }

  /**
   * レビューの投稿が可能かどうか
   */
  canCreateReviews(): boolean {
    return this._isActive && this._emailVerified
  }

  /**
   * プロフィールの編集が可能かどうか
   */
  canEditProfile(): boolean {
    return this._isActive
  }

  /**
   * 他のユーザーのコンテンツを削除可能かどうか
   */
  canDeleteOtherUsersContent(): boolean {
    return this._isAdmin && this._isActive
  }

  /**
   * 最終ログイン時刻を更新
   */
  updateLastLogin(): User {
    return new User({
      ...this.toProps(),
      lastLoginAt: new Date(),
      updatedAt: new Date()
    })
  }

  /**
   * メール認証状態を更新
   */
  verifyEmail(): User {
    return new User({
      ...this.toProps(),
      emailVerified: true,
      updatedAt: new Date()
    })
  }

  /**
   * アカウントを無効化
   */
  deactivate(): User {
    return new User({
      ...this.toProps(),
      isActive: false,
      updatedAt: new Date()
    })
  }

  /**
   * アカウントを有効化
   */
  activate(): User {
    return new User({
      ...this.toProps(),
      isActive: true,
      updatedAt: new Date()
    })
  }

  /**
   * 管理者権限を付与
   */
  grantAdminPrivileges(): User {
    return new User({
      ...this.toProps(),
      isAdmin: true,
      updatedAt: new Date()
    })
  }

  /**
   * 管理者権限を取消
   */
  revokeAdminPrivileges(): User {
    return new User({
      ...this.toProps(),
      isAdmin: false,
      updatedAt: new Date()
    })
  }

  /**
   * エンティティをプレーンオブジェクトに変換（永続化用）
   */
  toPlainObject(): UserPlainObject {
    return {
      id: this._id,
      email: this._email,
      username: this._username,
      full_name: this._fullName,
      avatar_url: this._avatarUrl,
      website: this._website,
      is_admin: this._isAdmin,
      is_active: this._isActive,
      email_verified: this._emailVerified,
      last_login_at: this._lastLoginAt?.toISOString(),
      created_at: this._createdAt?.toISOString(),
      updated_at: this._updatedAt?.toISOString()
    }
  }

  /**
   * プロパティオブジェクトを取得（内部使用）
   */
  private toProps(): UserProps {
    return {
      id: this._id,
      email: this._email,
      username: this._username,
      fullName: this._fullName,
      avatarUrl: this._avatarUrl,
      website: this._website,
      isAdmin: this._isAdmin,
      isActive: this._isActive,
      emailVerified: this._emailVerified,
      lastLoginAt: this._lastLoginAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    }
  }

  /**
   * プレーンオブジェクトからエンティティを生成
   */
  static fromPlainObject(data: UserPlainObject): User {
    return new User({
      id: data.id,
      email: data.email,
      username: data.username,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      website: data.website,
      isAdmin: data.is_admin,
      isActive: data.is_active,
      emailVerified: data.email_verified,
      lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }

  /**
   * エンティティの更新（不変性を保持）
   */
  update(updates: Partial<Omit<UserProps, 'id'>>): User {
    return new User({
      id: this._id, // ID cannot be changed
      email: updates.email ?? this._email,
      username: updates.username ?? this._username,
      fullName: updates.fullName ?? this._fullName,
      avatarUrl: updates.avatarUrl ?? this._avatarUrl,
      website: updates.website ?? this._website,
      isAdmin: updates.isAdmin ?? this._isAdmin,
      isActive: updates.isActive ?? this._isActive,
      emailVerified: updates.emailVerified ?? this._emailVerified,
      lastLoginAt: updates.lastLoginAt ?? this._lastLoginAt,
      createdAt: this._createdAt, // Creation date cannot be changed
      updatedAt: new Date()
    })
  }
}

// 永続化用のプレーンオブジェクト型
export interface UserPlainObject {
  id: string
  email?: string
  username?: string
  full_name?: string
  avatar_url?: string
  website?: string
  is_admin: boolean
  is_active: boolean
  email_verified: boolean
  last_login_at?: string
  created_at?: string
  updated_at?: string
}