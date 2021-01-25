import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum AppRole {
  ADMIN = "admin",
  PRIVILEGED = "privileged",
  INTERNAL = "internal",
  EXTERNAL = "external"
}

@Entity()
class User {
  @PrimaryGeneratedColumn("uuid")
  public identifier: string;

  @Column({
    unique: true,
    nullable: false
  })
  public userName: string;

  @Column({
    nullable: false
  })
  public password: string;

  @Column({
    unique: true,
    nullable: false
  })
  public email: string;

  @Column({
    nullable: false
  })
  public emailVerified: boolean;

  @Column({
    type: "enum",
    enum: AppRole,
    default: AppRole.EXTERNAL,
    nullable: false
  })
  public role: AppRole;
}

export default User;