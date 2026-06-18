defmodule Toia.Repo.Migrations.AddToiaUserAvatar do
  use Ecto.Migration

  def change do
    alter table(:toia_user) do
      add :avatar, :boolean, default: false
    end
  end
end
